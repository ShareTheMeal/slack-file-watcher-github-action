const core = require('@actions/core');
const github = require('@actions/github');
const { IncomingWebhook } = require('@slack/webhook');
const {GitHub} = require("@actions/github/lib/utils");
const util = require('util')
const parse = require('parse-diff');

function getAdditions(files, fileToWatch) {
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

async function getPRDiff(octoKit) {
    const {data: diff} = await octoKit.rest.pulls.get({
        repo: github.context.repo.repo,
        owner: github.context.repo.owner,
        pull_number: github.context.payload.pull_request.number,
        mediaType: {format: "diff"}
    });
    return diff;
}

async function notifySlack(slackChannel, additions) {
    const webhook = new IncomingWebhook(slackWebhook, {
        channel: slackChannel,
        username: "Additions to:" + fileToWatch
    });
    await webhook.send({
        text: additions.join('\r\n'),

    });
}

async function run() {
    try {
        const fileToWatch = core.getInput('file');
        const slackChannel = core.getInput('slack-channel');
        const slackWebhook = core.getInput('slack-webhook');
        const githubToken = core.getInput('github-token');
        const eventName = github.context.eventName;
        let didNotify;
        if (eventName === 'pull_request') {
            const octoKit = github.getOctokit(githubToken)
            const diff = await getPRDiff(octoKit);
            const files = parse(diff)
            const additions = getAdditions(files, fileToWatch);
            await notifySlack(slackChannel, additions);
            didNotify = true
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