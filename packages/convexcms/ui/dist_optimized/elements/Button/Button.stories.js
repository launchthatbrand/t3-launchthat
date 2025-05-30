import { jsx as _jsx } from "react/jsx-runtime";
import './index.scss';
import { Button } from './index';
import React from 'react';
export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: 'Button component from Payload CMS UI library. This component supports various styles, sizes, and icons.'
      }
    },
    layout: 'centered'
  }
};
const Template = args => /*#__PURE__*/_jsx("div", {
  style: {
    padding: '20px'
  },
  children: /*#__PURE__*/_jsx(Button, {
    ...args
  })
});
export const Primary = Template.bind({});
Primary.args = {
  children: 'Primary Button',
  buttonStyle: 'primary',
  size: 'medium'
} // export const Secondary = Template.bind({})
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
;
//# sourceMappingURL=Button.stories.js.map