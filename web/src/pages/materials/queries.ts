import { gql } from '@apollo/client'

export const GET_MATERIALS = gql`query GetMaterials($input: PaginationInput) { getMaterials(input: $input) }`
export const GET_MATERIAL = gql`query GetMaterial($input: IdInput!) { getMaterial(input: $input) }`
export const GET_CATEGORIES = gql`query GetCategories($input: PaginationInput) { getCategories(input: $input) }`
export const GET_SUPPLIERS = gql`query GetSuppliers($input: PaginationInput) { getSuppliers(input: $input) }`
export const ADD_MATERIAL = gql`mutation AddMaterial($input: AddMaterialInput!) { addMaterial(input: $input) }`
export const DEL_MATERIAL = gql`mutation DelMaterial($input: IdInput!) { delMaterial(input: $input) }`
export const ADD_CATEGORY = gql`mutation AddCategory($input: AddCategoryInput!) { addCategory(input: $input) }`
export const DEL_CATEGORY = gql`mutation DelCategory($input: IdInput!) { delCategory(input: $input) }`
export const ADD_SUPPLIER = gql`mutation AddSupplier($input: AddSupplierInput!) { addSupplier(input: $input) }`
export const DEL_SUPPLIER = gql`mutation DelSupplier($input: IdInput!) { delSupplier(input: $input) }`

export const ZONE_OPTIONS = [
  { value: 'RESCUE', label: '救助类' },
  { value: 'DISASTER', label: '抢险类' },
  { value: 'GENERAL', label: '通用类' },
  { value: 'TEMPERATURE', label: '恒温库' },
]

export type MasterTab = 'materials' | 'categories' | 'suppliers'
export const TAB_LABELS: Record<MasterTab, string> = {
  materials: '物资档案',
  categories: '物资大类',
  suppliers: '供应商',
}
