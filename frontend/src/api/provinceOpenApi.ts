const BASE_URL = 'https://provinces.open-api.vn/api/v1'

export interface VnProvince {
    name: string
    code: number
    division_type: string
    codename: string
    phone_code?: number
    districts?: VnDistrict[] | null
}

export interface VnDistrict {
    name: string
    code: number
    division_type: string
    codename: string
    province_code: number
    wards?: VnWard[] | null
}

export interface VnWard {
    name: string
    code: number
    division_type: string
    codename: string
    district_code: number
}

async function request<T>(url: string): Promise<T> {
    const res = await fetch(url)

    if (!res.ok) {
        throw new Error('Không thể tải dữ liệu địa chỉ')
    }

    return res.json()
}

export const provinceOpenApi = {
    getProvinces: async (): Promise<VnProvince[]> => {
        return request<VnProvince[]>(`${BASE_URL}/p/`)
    },

    getDistricts: async (provinceCode: string): Promise<VnDistrict[]> => {
        const province = await request<VnProvince>(
            `${BASE_URL}/p/${provinceCode}?depth=2`
        )

        return province.districts ?? []
    },

    getWards: async (districtCode: string): Promise<VnWard[]> => {
        const district = await request<VnDistrict>(
            `${BASE_URL}/d/${districtCode}?depth=2`
        )

        return district.wards ?? []
    },
}