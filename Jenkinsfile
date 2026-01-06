pipeline {
    agent any
    
    environment {
        NODE_VERSION = '20'
        PNPM_VERSION = '10.18.3'
        COVERAGE_THRESHOLD = '95'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh '''
                    npm install -g pnpm@${PNPM_VERSION}
                    pnpm install --frozen-lockfile
                '''
            }
        }
        
        stage('Lint & TypeScript') {
            steps {
                sh '''
                    pnpm lint
                    pnpm tsc:check
                '''
            }
        }
        
        stage('Unit Tests') {
            parallel {
                stage('Client Tests') {
                    steps {
                        sh 'pnpm test:unit:client'
                    }
                }
                stage('Server Tests') {
                    steps {
                        sh 'pnpm test:unit:server'
                    }
                }
            }
        }
        
        stage('Integration Tests') {
            steps {
                script {
                    // Démarrer MongoDB
                    sh '''
                        docker-compose -f docker-compose.test.yml up -d --wait
                        sleep 5
                    '''
                    
                    try {
                        sh '''
                            export MONGODB_URI="mongodb://127.0.0.1:27018/diaspomoney_test"
                            export NODE_ENV=test
                            pnpm test:integration
                        '''
                    } finally {
                        // Arrêter MongoDB
                        sh 'docker-compose -f docker-compose.test.yml down -v'
                    }
                }
            }
        }
        
        stage('E2E Tests') {
            steps {
                sh '''
                    pnpm exec playwright install --with-deps
                    pnpm build
                    pnpm test:e2e
                '''
            }
        }
        
        stage('Coverage') {
            steps {
                script {
                    // Démarrer MongoDB pour les tests de couverture
                    sh '''
                        docker-compose -f docker-compose.test.yml up -d --wait
                        sleep 5
                    '''
                    
                    try {
                        sh '''
                            export MONGODB_URI="mongodb://127.0.0.1:27018/diaspomoney_test"
                            export NODE_ENV=test
                            pnpm test:unit:coverage
                            pnpm test:integration --coverage
                        '''
                        
                        // Vérifier le seuil de couverture
                        sh '''
                            COVERAGE_FILE="./coverage/coverage-summary.json"
                            if [ ! -f "$COVERAGE_FILE" ]; then
                                echo "❌ Fichier de couverture non trouvé"
                                exit 1
                            fi
                            
                            TOTAL_COVERAGE=$(node -e "
                                const fs = require('fs');
                                const cov = JSON.parse(fs.readFileSync('./coverage/coverage-summary.json', 'utf8'));
                                console.log(cov.total.lines.pct.toFixed(2));
                            ")
                            
                            echo "📊 Couverture actuelle: ${TOTAL_COVERAGE}%"
                            echo "🎯 Seuil minimum requis: ${COVERAGE_THRESHOLD}%"
                            
                            THRESHOLD=${COVERAGE_THRESHOLD}
                            PASSED=$(node -e "console.log(${TOTAL_COVERAGE} >= ${THRESHOLD} ? 'true' : 'false')")
                            
                            if [ "$PASSED" = "false" ]; then
                                echo "❌ La couverture (${TOTAL_COVERAGE}%) est inférieure au seuil requis (${COVERAGE_THRESHOLD}%)"
                                exit 1
                            else
                                echo "✅ Couverture suffisante: ${TOTAL_COVERAGE}% >= ${COVERAGE_THRESHOLD}%"
                            fi
                        '''
                    } finally {
                        sh 'docker-compose -f docker-compose.test.yml down -v'
                    }
                }
            }
        }
        
        stage('Build') {
            steps {
                sh '''
                    export NODE_ENV=production
                    pnpm build
                '''
            }
        }
        
        stage('Deploy') {
            when {
                anyOf {
                    branch 'main'
                    branch 'rct'
                    branch 'dev'
                }
            }
            steps {
                script {
                    def env = env.BRANCH_NAME == 'main' ? 'prod' :
                              env.BRANCH_NAME == 'rct' ? 'rct' : 'dev'
                    
                    echo "🚀 Déploiement sur l'environnement: ${env}"
                    echo "📦 Commit: ${env.GIT_COMMIT}"
                    echo "👤 Auteur: ${env.GIT_AUTHOR_NAME}"
                    echo "🌿 Branche: ${env.BRANCH_NAME}"
                    
                    if (env == 'prod') {
                        // Demander approbation pour la production
                        def userInput = input(
                            id: 'deployProd',
                            message: "🚀 Déployer en PRODUCTION ?",
                            parameters: [
                                choice(
                                    choices: ['Oui', 'Non'],
                                    description: 'Confirmer le déploiement',
                                    name: 'confirm'
                                )
                            ]
                        )
                        
                        if (userInput != 'Oui') {
                            error("❌ Déploiement annulé par l'utilisateur")
                        }
                    }
                    
                    // Configurer kubectl selon l'environnement
                    def kubeconfig = ""
                    if (env == 'prod') {
                        kubeconfig = env.KUBECONFIG_PROD ?: "${env.HOME}/.kube/config-prod"
                    } else if (env == 'rct') {
                        kubeconfig = env.KUBECONFIG_RCT ?: "${env.HOME}/.kube/config-rct"
                    } else {
                        kubeconfig = env.KUBECONFIG_DEV ?: "${env.HOME}/.kube/config-dev"
                    }
                    
                    sh """
                        export KUBECONFIG=${kubeconfig}
                        chmod +x ./scripts/deploy.sh
                        ./scripts/deploy.sh ${env}
                    """
                    
                    // Vérifier le déploiement
                    sh """
                        export KUBECONFIG=${kubeconfig}
                        kubectl rollout status deployment/diaspomoney-app -n diaspomoney --timeout=300s || true
                        kubectl get pods -n diaspomoney -l app=diaspomoney-app
                    """
                }
            }
        }
    }
    
    post {
        always {
            // Publier les résultats de tests
            publishTestResults testResultsPattern: 'test-results/**/*.xml'
            publishHTML([
                reportDir: 'coverage',
                reportFiles: 'index.html',
                reportName: 'Coverage Report'
            ])
            
            // Publier les artifacts
            archiveArtifacts artifacts: 'coverage/**', allowEmptyArchive: true
            archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
            archiveArtifacts artifacts: '.next/**', allowEmptyArchive: true
        }
        
        failure {
            script {
                def env = env.BRANCH_NAME == 'main' ? 'prod' :
                          env.BRANCH_NAME == 'rct' ? 'rct' : 'dev'
                
                if (env in ['dev', 'rct', 'prod']) {
                    echo "🔄 Tentative de rollback..."
                    sh """
                        export KUBECONFIG=\$HOME/.kube/config-${env}
                        kubectl rollout undo deployment/diaspomoney-app -n diaspomoney || true
                    """
                }
            }
        }
        
        success {
            echo "✅ Pipeline réussi !"
        }
    }
}

