const core = require('@actions/core');
const github = require('@actions/github');
const { IncomingWebhook } = require('@slack/webhook');
const {GitHub} = require("@actions/github/lib/utils");
const util = require('util')

async function run() {
    try {
        const file = core.getInput('file');
        const slackChannel = core.getInput('slack-channel');
        const slackWebhook = core.getInput('slack-webhook');
        const githubToken = core.getInput('github-token');
        const client = new GitHub(githubToken);
        console.log(`File to watch: ${file}`);
        console.log(`Channel to notify: ${slackChannel}`)
        console.log(`Webhook: ${slackWebhook}`)
        console.log(`Github token: ${githubToken}`)
        const webhook = new IncomingWebhook(slackWebhook, {
            channel: slackChannel,
            username: "New Keys In Use"
        });
        const eventName = github.context.eventName;
        let didNotify;
        if (eventName === 'pull_request') {
            const octoKit = github.getOctokit(githubToken)
            const {data: diff} = await octoKit.rest.pulls.get({
                repo: github.context.repo.repo,
                owner: github.context.repo.owner,
                pull_number: github.context.payload.pull_request.number,
                mediaType: {format: "patch"}
            });
            console.log(diff);
            await webhook.send({
                text: 'File: ' + file + 'has changed',
            });
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