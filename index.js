const core = require('@actions/core');
const github = require('@actions/github');
const { IncomingWebhook } = require('@slack/webhook');
const {GitHub} = require("@actions/github/lib/utils");
const parse = require('parse-diff');

function getAdditions(diff, fileToWatch) {
    const files = parse(diff)
    const additions = [];
    files.filter(file => file.to.toLowerCase() === fileToWatch.toLowerCase())
        .forEach((file) => {
            file.chunks.forEach(chunk => {
                chunk.changes.filter(change => change.type === 'add')
                    .forEach(change => {
                        additions.push(change.content);
                    })
            })
        });
    return additions;
}

async function getPRDiff(githubToken) {
    const octoKit = github.getOctokit(githubToken)
    const {data: diff} = await octoKit.rest.pulls.get({
        repo: github.context.repo.repo,
        owner: github.context.repo.owner,
        pull_number: github.context.payload.pull_request.number,
        mediaType: {format: "diff"}
    });
    return diff;
}

async function notifySlack(slackChannel, slackWebhook, title, text) {
    const webhook = new IncomingWebhook(slackWebhook, {
        channel: slackChannel,
        username: title
    });
    await webhook.send({
        text: text,
    });
}

function getInputs() {
    const fileToWatch = core.getInput('file');
    const slackChannel = core.getInput('slack-channel');
    const slackWebhook = core.getInput('slack-webhook');
    const githubToken = core.getInput('github-token');
    const eventName = github.context.eventName;
    return {fileToWatch, slackChannel, slackWebhook, githubToken, eventName};
}

async function run() {
    try {
        const {fileToWatch, slackChannel, slackWebhook, githubToken, eventName} = getInputs();
        let didNotify;
        if (eventName === 'pull_request') {
            const diff = await getPRDiff(githubToken);
            const additions = getAdditions(diff, fileToWatch);
            if (additions.length == 0) {
                console.log("Not additions to the file found");
                didNotify = false
            } else {
                console.log("Found " + additions.length + ". Notifying channel: " + slackChannel);
                const title = "Additions to: " + fileToWatch;
                const text = additions.join('\r\n');
                await notifySlack(slackChannel, slackWebhook, title, text);
                didNotify = true
            }
        } else {
            didNotify = false
        }
        core.setOutput('didNotify', didNotify);
    } catch (error) {
        console.log(error);
        core.setFailed(error.message);
    }
}

(async () => {
    await run();
})();