import { type SchemaTypeDefinition } from 'sanity'
import { siteConfiguration } from './siteConfiguration'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [siteConfiguration],
}
