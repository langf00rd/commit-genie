#!/usr/bin/env node
const program = require('commander')
const fs = require('fs')
const { execSync } = require('child_process')
const axios = require('axios')

program
    .name("commit-genie")
    .version('0.1.3')
    .description("AI Git commit message generator 🤖")

program
    .argument('<path-to-repo>')
    .description("Looks for changes in a local repository and makes a commit for the new changes")
    .action((repoPath) => {
        checkPathExists(repoPath)
    })

program
    .command('listen')
    .description("listens for new changes in a repo")
    .action(() => {
    })

let newGitChanges,
    repoPath

async function chalk() {
    return (await import("chalk")).default
}

/** Checks if path user passed exists */
const checkPathExists = async (path) => {
    if (!fs.existsSync(path)) {
        console.log((await chalk()).red("❌ Path does not exist "))
        return
    }

    repoPath = path
    getChangedFiles()
}

/**  Gets all files with new changes */
const getChangedFiles = async () => {
    let changedFiles = execSync(`git -C ${repoPath} diff --name-only`).toString()

    if (!changedFiles) {
        console.log((await chalk()).blueBright("🤓 No changes found "))
        return
    }

    console.log((await chalk()).yellow(`🔎 Found changes in: ${changedFiles.toString()}`))
    console.log((await chalk()).blueBright(`🤖 Beep boop generating commit message...`))
    getChanges()
}

/**  Gets all new changes in repo */
const getChanges = async () => {
    let changes = execSync(`git -C ${repoPath} diff`).toString()
    newGitChanges = changes
    stageChanges()
}

/** Stages changes */
const stageChanges = async () => {
    execSync(`git -C ${repoPath} add .`)
    generateCommitMessage()
}

/** Generates commit message with GPT-3 */
const generateCommitMessage = async () => {
    let config = {
        method: 'post',
        // url: 'http://ai-server-qjof.onrender.com/generate-commit-message',
        url: 'http://localhost:3212/generate-commit-message',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ "code": newGitChanges })
    }

    await axios(config)
        .then(response => { commitChanges(response.data.payload.toString().replaceAll("Commit message: ", "").replaceAll("Commit: ", "")) })
        .catch(async error => {
            console.log((await chalk()).red(`❌ Error occured generating commit message: ${error} `))
        })
}

/**  Commits changes */
const commitChanges = async (message) => {
    execSync(`git -C ${repoPath} commit -m "${message}"`)
    console.log((await chalk()).green(`${message}`))
}

program.parse(process.argv)