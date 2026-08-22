pipeline {
    agent any

    parameters {
        string(name: 'branchToBuild', defaultValue: 'v1.0.0', description: 'Branch or tag to build and deploy')
        string(name: 'deployPort', defaultValue: '8025', description: 'Port to deploy the application on')
        string(name: 'instanceName', defaultValue: 'pokerpop', description: 'Name of the deployment instance (used for folder and container names)')
    }

    environment {
        WORK_DIR = '/var/jenkins_home/work'
        REPO_URL = 'https://github.com/ishaan230/PokerPop.git'
        HOST_DEPLOY_DIR = "/home/jenkins_deployer/Documents/jenkins/output/${params.instanceName}"
        COMPOSE_PROJECT_NAME = "${params.instanceName.toLowerCase()}"
    }

    stages {
        stage('Clone Repository') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'github-https', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
                    sh """
                    REPO_DIR="${WORK_DIR}/${params.instanceName}"
                    
                    rm -rf \${REPO_DIR}
                    
                    echo "Cloning repository for instance ${params.instanceName}..."
                    git clone --branch ${params.branchToBuild} https://\${GIT_USER}:\${GIT_TOKEN}@${env.REPO_URL.replace("https://", "")} \${REPO_DIR}
                    
                    cd \${REPO_DIR}
                    git rev-parse --abbrev-ref HEAD > client/.git-branch
                    
                    echo "--- Repository cloned successfully. ---"
                    """
                }
            }
        }

        stage('Deploy Remotely via SSH') {
            steps {
                sshagent(credentials: ['host-ssh-key']) {
                    sh """
                    echo "--- Stopping existing services on host... ---"
                    ssh -o StrictHostKeyChecking=yes jenkins_deployer@192.168.1.101 "cd ${HOST_DEPLOY_DIR} && APP_PORT=${params.deployPort} docker compose -p ${env.COMPOSE_PROJECT_NAME} down" || true

                    echo "--- Building and starting new services on host... ---"
                    ssh -o StrictHostKeyChecking=yes jenkins_deployer@192.168.1.101 "cd ${HOST_DEPLOY_DIR} && APP_PORT=${params.deployPort} docker compose -p ${env.COMPOSE_PROJECT_NAME} up --build -d"
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline finished successfully. Instance '${params.instanceName}' deployed on Port ${params.deployPort}."
        }
        failure {
            echo "Pipeline failed for instance '${params.instanceName}'. Please check the logs."
        }
    }
}
