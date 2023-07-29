const inquirer = require('inquirer');
const shell = require('shelljs');
const fs = require('fs');
const path = require('path');

// Questions for the user
const questions = [
  {
    type: 'list',
    name: 'projectType',
    message: 'Select a project type:',
    choices: ['API + Next.js', 'API', 'API + Vite'],
  },
  {
    type: 'input',
    name: 'projectName',
    message: 'Enter your project name:',
    when: (answers) => answers.projectType === 'API',
  },
  // Add more questions for params when needed (e.g., viteParams, nextAppParams).
];

// Define template file contents
const templates = {
  'API + Next.js': {
    nextApp: true,
    expressApp: true,
    comment: '🌐🚀 This template includes a Next.js app set up with create-next-app and an API server using Express with API routes.',
  },
  'API': {
    expressApp: true,
    comment: '🌐🔥 This template includes an API server using Express with API routes.',
  },
  'API + Vite': {
    viteApp: true,
    expressApp: true,
    comment: '🌐🎉 This template includes a Vite app with React set up and an API server using Express with API routes.',
  },
};

// Template configurations
const templateConfigFile = 'template-config.json';
let templateConfig = {};

// Function to create files based on the selected option
function createFiles(option, projectName) {
  const templateData = templates[option];
  const mainFolderName = projectName || 'my-app';

  // Create main folder
  shell.mkdir(mainFolderName);
  shell.cd(mainFolderName);

  // Create API folder and basic API route files
  if (templateData.expressApp) {
    shell.mkdir('api');
    shell.cp('-R', path.resolve(__dirname, 'templates', 'api'), 'api');
    createExpressServerFile();
  }

  // Create Next.js app
  if (templateData.nextApp) {
    shell.exec('npx create-next-app .');
  }

  // Create Vite app
  if (templateData.viteApp) {
    shell.exec('npm init vite@latest . -- --template react');
  }

  // Create start scripts based on the selected option
  if (templateData.nextApp) {
    createNextStartScript();
  }

  if (templateData.viteApp) {
    createViteStartScript();
  }

  // Create template-create.md file
  createTemplateCreateMD(option, projectName);

  // Save template configurations to a file
  saveTemplateConfig(option, projectName);

  // Log success message
  console.log(`✨ Your ${option} project has been created in the '${mainFolderName}' folder! ✨`);

  // Install necessary packages
  npmInstallDependencies();
}

// Function to create the Next.js start.js file
function createNextStartScript() {
  const nextStartScriptContent = `
const { createServer } = require('http');
const next = require('next');
const express = require('express');
const apiServer = require('./api/server');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = express();

  server.use('/api', apiServer);

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(\`> Ready on http://localhost:\${port}\`);
  });
});
  `;

  fs.writeFileSync('start-next.js', nextStartScriptContent);
}

// Function to create the Vite start.js file
function createViteStartScript() {
  const viteStartScriptContent = `
const express = require('express');
const apiServer = require('./api/server');
const { createServer } = require('http');
const { loadConfig } = require('vite');

async function start() {
  const app = express();

  app.use('/api', apiServer);

  const viteConfig = await loadConfig();
  const viteServer = await require('vite').createServer({ ...viteConfig, server: { middlewareMode: true } });

  app.use(viteServer.middlewares);

  const server = createServer(app);
  server.listen(3000, () => {
    console.log('Vite server is running on http://localhost:3000');
  });
}

start();
  `;

  fs.writeFileSync('start-vite.js', viteStartScriptContent);
}

// Function to create template-create.md file
function createTemplateCreateMD(option, projectName) {
    const templateData = templates[option];
    const mainFolderName = projectName || 'my-app';
  
    let mdContent = `
  # Template Create Information 🚀
  
  Use this information to find out what the CLI has created for you.
  
  ## ${option} ${templateData.comment}
  
  ### Files and Folders Created:
  
  - main folder: ${mainFolderName}
  `;
  
    if (templateData.expressApp) {
      mdContent += `
    - express server: ${mainFolderName}/api`;
    }
  
    if (templateData.nextApp) {
      mdContent += `
    - Next.js app: ${mainFolderName}`;
    }
  
    if (templateData.viteApp) {
      mdContent += `
    - Vite app with React: ${mainFolderName}`;
    }
  
    fs.writeFileSync('template-create.md', mdContent);
  }

// Function to create Express server file
function createExpressServerFile() {
  const expressServerContent = `
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

// Sample API route
app.get('/api/sample', (req, res) => {
  res.json({ message: 'Sample API route' });
});

app.listen(port, () => {
  console.log(\`🚀 Express server is running on http://localhost:\${port}\`);
});
  `;

  fs.writeFileSync(path.join('api', 'server.js'), expressServerContent);
}

// Function to save template configurations to a file
function saveTemplateConfig(option, projectName) {
  const mainFolderName = projectName || 'my-app';
  const templateData = templates[option];
  templateConfig = {
    projectType: option,
    projectName: mainFolderName,
    templateComment: templateData.comment,
  };
  fs.writeFileSync(templateConfigFile, JSON.stringify(templateConfig, null, 2));
}

// Function to install necessary packages
function npmInstallDependencies() {
  shell.cd(templateConfig.projectName);
  if (templateConfig.projectType === 'API + Next.js') {
    shell.exec('npm install express');
  } else if (templateConfig.projectType === 'API + Vite') {
    shell.exec('npm install express @vitejs/plugin-react');
  } else if (templateConfig.projectType === 'API') {
    shell.exec('npm install express');
  }
  // Add more npm install commands for additional dependencies as needed
}

// Start the CLI
inquirer.prompt(questions).then((answers) => {
  const { projectType, projectName } = answers;
  createFiles(projectType, projectName);
});
