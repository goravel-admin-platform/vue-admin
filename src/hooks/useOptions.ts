import { reactive, toRaw } from 'vue'

interface Options {
    [propName: string]: {
        fetch: PromiseFun
        params?: Record<string, any>
        transformData?(data: any): any
    }
}

export function useOptions<T = any>(options: Options) {
    const optionsData: any = reactive({})
    const optionsKey = Object.keys(options)
    const apiList = optionsKey.map((key) => {
        const value = options[key]
        optionsData[key] = []
        return () => value.fetch(toRaw(value.params) || {})
    })

    const refresh = async () => {
        const res = await Promise.allSettled<Promise<any>>(apiList.map((api) => api()))
        res.forEach((item, index) => {
            const key = optionsKey[index]
            if (item.status === 'fulfilled') {
                const { transformData } = options[key]
                const { data } = transformData ? transformData(item.value) : item.value
                optionsData[key] = data
            }
        })
    }
    refresh().then()
    return {
        options: optionsData as T,
        refresh
    }
}
