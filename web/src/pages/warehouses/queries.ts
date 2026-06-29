import { gql } from '@apollo/client'

export const GET_WAREHOUSES = gql`query GetWarehouses { getWarehouses }`
export const GET_SHELVES = gql`query GetShelves($warehouseId: ID, $input: PaginationInput) { getShelves(warehouseId: $warehouseId, input: $input) }`
export const ADD_WAREHOUSE = gql`mutation AddWarehouse($input: AddWarehouseInput!) { addWarehouse(input: $input) }`
export const ADD_SHELF = gql`mutation AddShelf($input: AddShelfInput!) { addShelf(input: $input) }`
export const DEL_WAREHOUSE = gql`mutation DelWarehouse($input: IdInput!) { delWarehouse(input: $input) }`
export const DEL_SHELF = gql`mutation DelShelf($input: IdInput!) { delShelf(input: $input) }`

export const ZONE_OPTIONS = [
  { value: 'RESCUE', label: '救助类' }, { value: 'DISASTER', label: '抢险类' },
  { value: 'GENERAL', label: '通用类' }, { value: 'TEMPERATURE', label: '恒温库' },
]

export type WarehouseTab = 'warehouse' | 'shelf'
