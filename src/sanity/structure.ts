import type {StructureResolver} from 'sanity/structure'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Site Configuration')
        .child(
          S.document()
            .documentId('siteConfiguration')
            .schemaType('siteConfiguration')
        ),
      ...S.documentTypeListItems().filter((item) => item.getId() !== 'siteConfiguration'),
    ])

