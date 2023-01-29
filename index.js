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
        spinner.reset()
        return
    }

    spinner.start()
    workingPath = path
    await getChangedFiles()
}

/**  Gets all files with new changes */
const getChangedFiles = async () => {
    try {
        let changedFiles = execSync(`git -C ${workingPath} diff --name-only`).toString()

        if (!changedFiles) {
            console.log((await chalk()).blueBright("🤓 No changes found \n"))
            spinner.reset()
            return
        }

        console.log((await chalk()).yellow(`🔎 Found changes in files: ${changedFiles}`))
        await getChanges()
    } catch (err) {
        // console.log((await chalk()).red("❌ Error occured:", err.message))
        spinner.error()
    }
}

/**  Gets all new changes in repo */
const getChanges = async () => {
    try {
        let changes = execSync(`git -C ${workingPath} diff`).toString()
        newGitChanges = changes
        await stageChanges()
    } catch (err) {
        // console.log((await chalk()).red("❌ Error occured:", err.message))
        spinner.error()
    }

}

/** Stages changes */
const stageChanges = async () => {
    try {
        console.log("staging", workingPath)
        execSync(`git -C ${workingPath} add .`)
        await generateCommitMessage()
    } catch (err) {
        // console.log((await chalk()).red("❌ Error occured:", err.message))
        spinner.error()
    }

}

/** Generates commit message with GPT-3 */
const generateCommitMessage = async () => {
    try {
        // let commitMessage_ = await axios.post("http://localhost:3212/generate-commit-message", {
        let commitMessage_ = await axios.post("https://ai-server-qjof.onrender.com/generate-commit-message", {
            code: newGitChanges
        })

        if (commitMessage_.data.payload) {
            commitMessage = commitMessage_.data.payload
            console.log((await chalk()).green(`✨ ${commitMessage_.data.payload}`))
            await commitChanges()
        }
    } catch (err) {
        console.log((await chalk()).red("❌ Error occured generating commit message:", err.message))
        spinner.error()
    }
}

/**  Commits changes */
const commitChanges = async () => {
    try {
        execSync(`git -C ${workingPath} commit -m "${commitMessage}"`)
        spinner.success()
    } catch (err) {
        // console.log((await chalk()).red("❌ Error occured:", err.message))
        spinner.error()
    }
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