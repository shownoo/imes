import { gql } from '@apollo/client'

export const GET_MATERIALS = gql`query GetMaterials($input: PaginationInput) { getMaterials(input: $input) }`
export const GET_MATERIAL = gql`query GetMaterial($input: IdInput!) { getMaterial(input: $input) }`
export const GET_CATEGORIES = gql`query GetCategories($input: PaginationInput) { getCategories(input: $input) }`
export const GET_SUPPLIERS = gql`query GetSuppliers($input: PaginationInput) { getSuppliers(input: $input) }`
export const GET_OUTBOUND_PURPOSES = gql`query GetOutboundPurposes($enabledOnly: Boolean, $input: PaginationInput) { getOutboundPurposes(enabledOnly: $enabledOnly, input: $input) }`
export const ADD_OUTBOUND_PURPOSE = gql`mutation AddOutboundPurpose($input: AddOutboundPurposeInput!) { addOutboundPurpose(input: $input) }`
export const DEL_OUTBOUND_PURPOSE = gql`mutation DelOutboundPurpose($input: IdInput!) { delOutboundPurpose(input: $input) }`
export const GET_OUTBOUND_DESTINATIONS = gql`query GetOutboundDestinations($enabledOnly: Boolean, $city: String, $useOrgCity: Boolean, $input: PaginationInput) { getOutboundDestinations(enabledOnly: $enabledOnly, city: $city, useOrgCity: $useOrgCity, input: $input) }`
export const ADD_OUTBOUND_DESTINATION = gql`mutation AddOutboundDestination($input: AddOutboundDestinationInput!) { addOutboundDestination(input: $input) }`
export const DEL_OUTBOUND_DESTINATION = gql`mutation DelOutboundDestination($input: IdInput!) { delOutboundDestination(input: $input) }`
export const GET_ORG_CITY = gql`query GetOrgCity { getOrgCity }`
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

export type MasterTab = 'materials' | 'categories' | 'suppliers' | 'purposes' | 'destinations' | 'warehouses' | 'shelves'
export const TAB_LABELS: Record<MasterTab, string> = {
  materials: '物资档案',
  categories: '物资大类',
  suppliers: '供应商',
  purposes: '出库用途',
  destinations: '出库目的地',
  warehouses: '仓库',
  shelves: '货位',
}
