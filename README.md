# Slack File Watcher Action

Checks if the file provided has additions and sends them notification to a slack channel.

## Usage

See [action.yml](action.yml)
```yaml
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Hello world action step
        id: slack-notifier
        uses: ./
        with:
          file: 'Translations.xml'
          slack-title: 'New Keys'
          slack-webhook: ${{ secrets.SLACK_WEBHOOK }}
          slack-channel: '#action_test'
          github-token: ${{ github.token }}
```