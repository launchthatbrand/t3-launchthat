import './index.scss'

import { Button } from './index'
import React from 'react'

export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          'Button component from Payload CMS UI library. This component supports various styles, sizes, and icons.',
      },
    },
    layout: 'centered',
  },
  // argTypes: {
  //   children: { control: 'text', description: 'Button label content' },
  //   buttonStyle: {
  //     control: 'select',
  //     options: ['primary', 'secondary', 'icon', 'none'],
  //     description: 'Visual style of the button',
  //   },
  //   size: {
  //     control: 'select',
  //     options: ['small', 'medium', 'large'],
  //     description: 'Size of the button',
  //   },
  //   icon: {
  //     control: 'select',
  //     options: [null, 'chevron', 'edit', 'plus', 'x', 'link', 'swap'],
  //     description: 'Built-in icon to show in the button',
  //   },
  //   iconPosition: {
  //     control: 'select',
  //     options: ['left', 'right'],
  //     description: 'Position of the icon',
  //   },
  //   disabled: { control: 'boolean', description: 'Disabled state' },
  // },
}

const Template = (args) => (
  <div style={{ padding: '20px' }}>
    <Button {...args} />
  </div>
)

export const Primary = Template.bind({})
Primary.args = {
  children: 'Primary Button',
  buttonStyle: 'primary',
  size: 'medium',
}

// export const Secondary = Template.bind({})
// Secondary.args = {
//   children: 'Secondary Button',
//   buttonStyle: 'secondary',
//   size: 'medium',
// }

// export const WithIcon = Template.bind({})
// WithIcon.args = {
//   children: 'Button with Icon',
//   buttonStyle: 'primary',
//   icon: 'plus',
//   iconPosition: 'left',
// }

// export const IconOnly = Template.bind({})
// IconOnly.args = {
//   icon: 'plus',
//   buttonStyle: 'icon',
//   'aria-label': 'Add item',
// }

// export const SmallButton = Template.bind({})
// SmallButton.args = {
//   children: 'Small Button',
//   size: 'small',
// }

// export const LargeButton = Template.bind({})
// LargeButton.args = {
//   children: 'Large Button',
//   size: 'large',
// }

// export const DisabledButton = Template.bind({})
// DisabledButton.args = {
//   children: 'Disabled Button',
//   disabled: true,
// }
