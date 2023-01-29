#!/usr/bin/env node
const program = require('commander')
const fs = require('fs')
const { exec, execSync } = require('child_process')
const axios = require('axios')
const { createSpinner } = require("nanospinner")

let newGitChanges,
    commitMessage,
    workingPath,
    spinner = createSpinner('Generating commit message \n')

async function chalk() {
    return (await import("chalk")).default
}

/** Checks if path user passed exists */
const checkPathExists = async (path) => {
    if (!fs.existsSync(path)) {
        console.log((await chalk()).red("❌ Path does not exist \n"))
        // spinner.reset()
        return
    }

    // spinner.start()
    workingPath = path
    getChangedFiles()
}

/**  Gets all files with new changes */
const getChangedFiles = async () => {
    let changedFiles = execSync(`git -C ${workingPath} diff --name-only`).toString()

    if (!changedFiles) {
        console.log((await chalk()).blueBright("🤓 No changes found \n"))
        // spinner.reset()
        return
    }

    console.log((await chalk()).yellow(`🔎 Found changes in files: ${changedFiles}`))
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
        .then((response) => {
            // let response_ = 
            // console.log(response_.toString())
            // console.log(response.data.payload.toString())
            commitChanges(response.data.payload.toString())
            // console.log((await chalk()).yellow(`✨ ${message}`))
        })
        .catch(async (error) => {
            console.log((await chalk()).red(`❌ Error occured generating commit message: ${error}`))
            // spinner.error()
        })
}

/**  Commits changes */
const commitChanges = async (message) => {
    execSync(`git -C ${workingPath} commit -m "${message}"`)
    console.log((await chalk()).green("✨", `${message}`))
    // spinner.success()
}


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

program.parse(process.argv)