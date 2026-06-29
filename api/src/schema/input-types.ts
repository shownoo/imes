import { builder } from '../builder.js'

export const IdInput = builder.inputType('IdInput', {
  fields: (t) => ({
    id: t.id({ required: true }),
  }),
})

export const PaginationInput = builder.inputType('PaginationInput', {
  fields: (t) => ({
    search: t.string({ required: false }),
    take: t.int({ required: false }),
    skip: t.int({ required: false }),
  }),
})
