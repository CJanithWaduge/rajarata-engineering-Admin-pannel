import { useState } from 'react'
import { TextField } from './TextField'
import type { TextFieldProps } from './TextField'

type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'endAdornment'>

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const isDark = props.tone === 'dark'

  return (
    <TextField
      {...props}
      className={['password-field-input', props.className]
        .filter(Boolean)
        .join(' ')}
      type={visible ? 'text' : 'password'}
      endAdornment={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className={[
            'rounded-chip px-2 py-1 font-label-sm text-label-sm transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2',
            isDark
              ? 'text-primary-fixed-dim hover:bg-white/10 focus-visible:outline-primary-fixed-dim'
              : 'text-primary hover:bg-primary-fixed/50 focus-visible:outline-primary-container',
          ].join(' ')}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      }
    />
  )
}
