pipeline {
    agent any

    environment {
        WORK_DIR = '/var/jenkins_home/work'
        REPO_URL = 'https://github.com/ishaan230/PokerPop.git'
        HOST_DEPLOY_DIR = '/home/jenkins_deployer/Documents/jenkins/output/PokerPop'
    }

    stages {
        stage('Clone Repository') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'github-https', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
                    sh """
                    REPO_DIR="${WORK_DIR}/PokerPop"
                    
                    rm -rf \${REPO_DIR}
                    
                    echo "Cloning PokerPop repository..."
                    git clone --branch v1.0.0 https://\${GIT_USER}:\${GIT_TOKEN}@${env.REPO_URL.replace("https://", "")} \${REPO_DIR}
                    
                    echo "--- PokerPop repository cloned successfully. ---"
                    """
                }
            }
        }

        stage('Deploy Remotely via SSH') {
            steps {
                sshagent(credentials: ['host-ssh-key']) {
                    sh """
                    echo "--- Stopping existing services on host... ---"
                    ssh -o StrictHostKeyChecking=yes jenkins_deployer@192.168.1.101 "cd ${HOST_DEPLOY_DIR} && docker compose down" || true

                    echo "--- Building and starting new services on host... ---"
                    ssh -o StrictHostKeyChecking=yes jenkins_deployer@192.168.1.101 "cd ${HOST_DEPLOY_DIR} && docker compose up --build -d"
                    """
                }
            }
        }
    }

    post {
        success {
            echo 'PokerPop pipeline finished and deployed successfully on Port 8025.'
        }
        failure {
            echo 'PokerPop pipeline failed. Please check the logs.'
        }
    }
}
