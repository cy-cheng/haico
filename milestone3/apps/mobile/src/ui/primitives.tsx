import type { ReactNode } from 'react'
import {
  Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from 'react-native'
import Svg, { Path, type SvgProps } from 'react-native-svg'
import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'

export const p = {
  bg: '#eef2eb', paper: '#fffdf7', ink: '#182d24', muted: '#4f6357', line: '#ccd8cd',
  fine: '#a5b7aa', forest: '#145641', tint: '#dbe8df', white: '#fff',
  orange: '#9a3727', blush: '#f7e5de', blue: '#264f66', blueWash: '#e0edf3',
}

export const common = StyleSheet.create({
  column: { gap: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  rule: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: p.fine },
  grow: { flex: 1, minWidth: 0 },
  rail: { flexShrink: 0, width: '100%', maxWidth: 660, alignSelf: 'center' },
  screen: { flex: 1, width: '100%', maxWidth: 660, alignSelf: 'center' },
  panel: { borderRadius: 14, borderWidth: 1, borderColor: p.line, backgroundColor: p.paper, padding: 14, gap: 8 },
  error: { backgroundColor: p.blush, color: p.orange, padding: 12, borderRadius: 10 },
  input: {
    borderWidth: 1, borderColor: p.fine, minHeight: 46, color: p.ink, backgroundColor: p.paper, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 16,
  },
})

const paths = {
  chat: 'M6 18 3 21v-4a6.5 6.5 0 0 1-1-3.5V8a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H6ZM7 9h10M7 13h6',
  map: 'M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Zm-5 0a3 3 0 1 0-6 0 3 3 0 0 0 6 0Z',
  trip: 'M5 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm14 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM7 7h10a3 3 0 1 1 0 6H7a2 2 0 0 0 0 4h10',
  manage: 'M3 6h18m-18 6h18m-18 6h18M9 4v4m7 2v4m-9 2v4',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  back: 'm14 6-6 6 6 6',
  memory: 'M4 4h14a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2V4Zm0 12h16M8 8h8M8 12h6',
  send: 'M3 3l18 9-18 9 3-9-3-9Zm3 9h15',
}

export function Icon({ name, size = 20, color = p.ink, ...props }: SvgProps & { name: keyof typeof paths; size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false} {...props}>
    <Path d={paths[name]} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
}

export function Title({ children }: { children: ReactNode }) {
  return <Text accessibilityRole="header" style={{
    color: p.ink, fontSize: 29, fontWeight: '700', letterSpacing: -0.6, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia',
  }}>{children}</Text>
}

export function Heading({ children }: { children: ReactNode }) {
  return <Text accessibilityRole="header" style={{ color: p.ink, fontSize: 18, fontWeight: '700' }}>{children}</Text>
}

export function Copy({ children, muted = false, style }: { children: ReactNode; muted?: boolean; style?: StyleProp<TextStyle> }) {
  return <Text style={[{ color: muted ? p.muted : p.ink, fontSize: 14, lineHeight: 20 }, style]}>{children}</Text>
}

export function Meta({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[{ fontSize: 12, color: p.muted, fontWeight: '600', lineHeight: 18 }, style]}>{children}</Text>
}

export function Button({ label, onPress, kind = 'outline', disabled = false, selected, icon, style }: {
  label: string; onPress: () => void; kind?: 'outline' | 'dark' | 'quiet' | 'warn'; disabled?: boolean;
  selected?: boolean; icon?: keyof typeof paths; style?: StyleProp<ViewStyle>;
}) {
  const tint = kind === 'dark' || selected ? p.white : kind === 'warn' ? p.orange : p.forest
  return <Pressable
    accessibilityRole="button" accessibilityState={{ disabled, ...(selected !== undefined ? { selected } : {}) }}
    onPress={onPress} disabled={disabled}
    style={({ pressed }) => [{
      minHeight: 44, paddingVertical: 7, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      flexShrink: 1, gap: 6, borderRadius: 22, borderWidth: kind === 'quiet' && !selected ? 0 : 1,
      borderColor: kind === 'warn' ? p.orange : p.forest,
      backgroundColor: kind === 'dark' || selected ? p.forest : (kind === 'warn' ? p.paper : 'transparent'),
      opacity: disabled ? 0.45 : pressed ? 0.72 : 1,
    }, style]}>
    {!!icon && <Icon name={icon} size={16} color={tint} />}
    <Text style={{ color: tint, fontSize: 13, fontWeight: '700', textAlign: 'center', flexShrink: 1 }}>{label}</Text>
  </Pressable>
}

export function Input(props: TextInputProps) {
  return <TextInput {...props} placeholderTextColor={p.muted} style={[common.input, props.style]} />
}

export function Panel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[common.panel, style]}>{children}</View>
}

export function Page({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <ScrollView contentContainerStyle={[{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 22, gap: 14 }, style]}
    keyboardShouldPersistTaps="handled" style={common.screen}>{children}</ScrollView>
}

export const formatDate = (date: string) => new Intl.DateTimeFormat('en-US', {
  weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
}).format(new Date(`${date}T00:00:00Z`))
export const formatTime = (iso: string) => iso.slice(11, 16)
export const formatSourceDate = (iso: string, timezone: string) => new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: timezone,
}).format(new Date(iso))

export function dateRange(first: string, last: string) {
  const dates: string[] = []
  for (let date = new Date(`${first}T00:00:00Z`); date.toISOString().slice(0, 10) <= last && dates.length < 366; date.setUTCDate(date.getUTCDate() + 1)) {
    dates.push(date.toISOString().slice(0, 10))
  }
  return dates
}

export function localTripTime(date: string, time: string, timeZone: string) {
  const wall = Date.parse(`${date}T${time}:00Z`)
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  })
  function zoneOffset(instant: number) {
    const clock = Object.fromEntries(formatter.formatToParts(new Date(instant)).map(({ type, value }) => [type, value]))
    return Math.round((Date.parse(`${clock.year}-${clock.month}-${clock.day}T${clock.hour}:${clock.minute}:${clock.second}Z`) - instant) / 60_000)
  }
  const offset = zoneOffset(wall - zoneOffset(wall) * 60_000)
  const minutes = Math.abs(offset)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date}T${time}:00${offset >= 0 ? '+' : '-'}${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`
}

export function ErrorText({ message }: { message: string }) {
  return <Text accessibilityRole="alert" style={common.error}>{message}</Text>
}

export async function openExternal(url: string) {
  if (new URL(url).protocol !== 'https:') throw new Error('This source does not have an HTTPS link.')
  await Linking.openURL(url)
}

export async function shareCalendar(contents: string, filename: string) {
  if (Platform.OS === 'web') {
    const href = URL.createObjectURL(new Blob([contents], { type: 'text/calendar' }))
    const link = document.createElement('a')
    link.href = href
    link.download = filename
    document.body.append(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(href), 1_000)
    return
  }
  if (!await Sharing.isAvailableAsync()) throw new Error('This device cannot share calendar files.')
  const file = new File(Paths.cache, filename)
  file.write(contents)
  await Sharing.shareAsync(file.uri, { mimeType: 'text/calendar', UTI: 'com.apple.ical.ics' })
}
