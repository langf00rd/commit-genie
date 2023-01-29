#!/usr/bin/env node
const program = require('commander')
const fs = require('fs')
const { execSync } = require('child_process')
const axios = require('axios')

program
    .name("commit-genie")
    .version('0.1.0')
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
    workingPath

async function chalk() {
    return (await import("chalk")).default
}

/** Checks if path user passed exists */
const checkPathExists = async (path) => {
    if (!fs.existsSync(path)) {
        console.log((await chalk()).red("❌ Path does not exist \n"))
        return
    }

    workingPath = path
    getChangedFiles()
}

/**  Gets all files with new changes */
const getChangedFiles = async () => {
    let changedFiles = execSync(`git -C ${workingPath} diff --name-only`).toString()

    if (!changedFiles) {
        console.log((await chalk()).blueBright("🤓 No changes found \n"))
        return
    }

    console.log((await chalk()).yellow(`🔎 Found changes in files: ${changedFiles}`))
    console.log((await chalk()).blueBright(`🤖 Beep boop generating commit message...\n`))
    getChanges()
}

/**  Gets all new changes in repo */
const getChanges = async () => {
    let changes = execSync(`git -C ${workingPath} diff`).toString()
    newGitChanges = changes
    stageChanges()
}

/** Stages changes */
const stageChanges = async () => {
    execSync(`git -C ${workingPath} add .`)
    generateCommitMessage()
}

/** Generates commit message with GPT-3 */
const generateCommitMessage = async () => {
    let config = {
        method: 'post',
        url: 'http://ai-server-qjof.onrender.com/generate-commit-message',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ "code": newGitChanges })
    }

    await axios(config)
        .then(response => { commitChanges(response.data.payload.toString()) })
        .catch(async error => {
            console.log((await chalk()).red(`❌ Error occured generating commit message: ${error} \n`))
        })
}

/**  Commits changes */
const commitChanges = async (message) => {
    execSync(`git -C ${workingPath} commit -m "${message}"`)
    console.log((await chalk()).green(`${message}\n`))
}

program.parse(process.argv)