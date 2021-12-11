const core = require('@actions/core');
const github = require('@actions/github');
const { IncomingWebhook } = require('@slack/webhook');
const {GitHub} = require("@actions/github/lib/utils");
const util = require('util')
const parse = require('parse-diff');

async function run() {
    try {
        const fileToWatch = core.getInput('file');
        const slackChannel = core.getInput('slack-channel');
        const slackWebhook = core.getInput('slack-webhook');
        const githubToken = core.getInput('github-token');
        const client = new GitHub(githubToken);
        console.log(`File to watch: ${fileToWatch}`);
        console.log(`Channel to notify: ${slackChannel}`)
        console.log(`Webhook: ${slackWebhook}`)
        console.log(`Github token: ${githubToken}`)
        const webhook = new IncomingWebhook(slackWebhook, {
            channel: slackChannel,
            username: "Additions to:" + fileToWatch
        });
        const eventName = github.context.eventName;
        let didNotify;
        if (eventName === 'pull_request') {
            const octoKit = github.getOctokit(githubToken)
            const {data: diff} = await octoKit.rest.pulls.get({
                repo: github.context.repo.repo,
                owner: github.context.repo.owner,
                pull_number: github.context.payload.pull_request.number,
                mediaType: {format: "diff"}
            });
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
            await webhook.send({
                text: additions.join('\r\n'),

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