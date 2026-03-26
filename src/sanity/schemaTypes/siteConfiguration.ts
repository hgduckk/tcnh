import { Rule } from 'sanity'

export const siteConfiguration = {
  name: 'siteConfiguration',
  title: 'Site Configuration',
  type: 'document',
  // Singleton document: only one configuration object
  __experimental_actions: ['update', 'publish'],
  fields: [
    {
      name: 'title',
      title: 'Site title',
      type: 'string',
      validation: (Rule: Rule) => Rule.required().max(60),
      initialValue: 'Đoàn Khoa Tài chính - Ngân hàng',
    },
    {
      name: 'frontendUrl',
      title: 'Website URL',
      type: 'url',
      validation: (Rule: Rule) => Rule.required(),
      initialValue: 'https://example.com',
      description: 'Absolute URL to the public website',
    },
    {
      name: 'adminPageUrl',
      title: 'Admin page URL',
      type: 'url',
      validation: (Rule: Rule) => Rule.required(),
      initialValue: 'https://example.com/admin',
      description: 'Absolute URL to the website admin dashboard',
    },
    {
      name: 'showAdminLink',
      title: 'Show admin link on public site?',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'adminLinkLabel',
      title: 'Admin link label',
      type: 'string',
      initialValue: 'Admin Dashboard',
      validation: (Rule: Rule) => Rule.required().max(40),
    },
  ],
}
