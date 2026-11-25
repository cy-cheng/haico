import { useState } from 'react'
import { View } from 'react-native'
import { createApiClient, serverOrigin, type WaymarkClient } from '../platform/api'
import { Button, Copy, ErrorText, Input, Meta, Page, Panel, Title, common } from './primitives'

export function ConnectPreview({ onConnect, onClose, address: initialAddress }: {
  onConnect(client: WaymarkClient, origin: string): void; onClose(): void; address: string;
}) {
  const [address, setAddress] = useState(initialAddress)
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function connect() {
    setError('')
    setBusy(true)
    try {
      const origin = serverOrigin(address)
      const sessionToken = token.trim()
      const client = createApiClient(origin, { accessToken: () => sessionToken })
      await client.me()
      setToken('')
      onConnect(client, origin)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect.')
    } finally {
      setBusy(false)
    }
  }

  return <Page>
    <Button label="Back to preview" icon="back" onPress={onClose} kind="quiet" style={{ alignSelf: 'flex-start' }} />
    <Title>Connect to a test server</Title>
    <Copy muted>Use a session issued by your Waymark test server. The token stays in memory for this connection and is not saved on the device.</Copy>
    <Panel>
      <Meta>Server address</Meta>
      <Input accessibilityLabel="Server address" value={address} onChangeText={setAddress} autoCapitalize="none" autoCorrect={false}
        keyboardType="url" placeholder="http://127.0.0.1:3000" />
      <Meta>Test session token</Meta>
      <Input accessibilityLabel="Test session token" value={token} onChangeText={setToken} autoCapitalize="none" autoCorrect={false}
        secureTextEntry placeholder="Paste your test session token" />
      {!!error && <ErrorText message={error} />}
      <View style={common.row}>
        <Button label={busy ? 'Connecting…' : 'Connect'} onPress={() => void connect()} kind="dark"
          disabled={busy || !address.trim() || !token.trim()} />
      </View>
    </Panel>
  </Page>
}
