export interface VietQrBank {
    id: number
    name: string
    code: string
    bin: string
    shortName: string
    logo?: string | null
    transferSupported?: number
    lookupSupported?: number
}

interface VietQrBanksResponse {
    code: string
    desc: string
    data: VietQrBank[]
}

const BANKS_URL = 'https://api.vietqr.io/v2/banks'

export const bankApi = {
    getBanks: async (): Promise<VietQrBank[]> => {
        const res = await fetch(BANKS_URL)

        if (!res.ok) {
            throw new Error('Không thể tải danh sách ngân hàng')
        }

        const json = (await res.json()) as VietQrBanksResponse

        return [...(json.data ?? [])].sort((a, b) => {
            return a.shortName.localeCompare(b.shortName)
        })
    },
}