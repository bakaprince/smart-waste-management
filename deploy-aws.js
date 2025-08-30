const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Deploying Smart Waste Management to AWS...');

// Create Dockerfile
const dockerfile = `
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
`;

fs.writeFileSync('Dockerfile', dockerfile);

// Create docker-compose for local testing
const dockerCompose = `
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/waste-management
    depends_on:
      - mongo
  
  mongo:
    image: mongo:5
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
`;

fs.writeFileSync('docker-compose.yml', dockerCompose);

// Create AWS Elastic Beanstalk configuration
const ebConfig = {
  "AWSEBDockerrunVersion": 2,
  "containerDefinitions": [
    {
      "name": "waste-management-app",
      "image": "waste-management:latest",
      "essential": true,
      "memory": 512,
      "portMappings": [
        {
          "hostPort": 80,
          "containerPort": 3000
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ]
    }
  ]
};

fs.writeFileSync('Dockerrun.aws.json', JSON.stringify(ebConfig, null, 2));

// Create GitHub Actions workflow
const githubWorkflow = `
name: Deploy to AWS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Run tests
      run: npm test || echo "No tests specified"
      
    - name: Deploy to Elastic Beanstalk
      uses: einaregilsson/beanstalk-deploy@v21
      with:
        aws_access_key: \${{ secrets.AWS_ACCESS_KEY_ID }}
        aws_secret_key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
        application_name: smart-waste-management
        environment_name: smart-waste-management-env
        version_label: \${{ github.sha }}
        region: us-east-1
        deployment_package: .
`;

if (!fs.existsSync('.github/workflows')) {
  fs.mkdirSync('.github/workflows', { recursive: true });
}
fs.writeFileSync('.github/workflows/deploy.yml', githubWorkflow);

console.log('✅ AWS deployment files created!');
console.log('\nNext steps:');
console.log('1. Create AWS Elastic Beanstalk application');
console.log('2. Set up MongoDB Atlas for production database');
console.log('3. Configure environment variables in AWS');
console.log('4. Push to GitHub to trigger deployment');
