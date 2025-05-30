import type { CollectionMeHook } from 'payload'

const meHook: CollectionMeHook = async ({ args, user }) => {
  console.log('meHook')
}

export default meHook
