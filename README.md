# Slack File Watcher Action

Checks if the files provided have changed and sends a notification to slack if they have.

## Inputs

## `file`

**Required** The file that should be watched.

## `slack-channel`

**Required** The channel that will received the notification. eg `#my_channel`

## `slack-token`

**Required** Slack webhook. e.g. `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX`

## Outputs

## `didNotify`

Shows if the file has been changed and the channel notified

## Example usage

uses: actions/hello-world-javascript-action@v1.1
with:
who-to-greet: 'Mona the Octocat'