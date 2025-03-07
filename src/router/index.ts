import { trim } from 'lodash-es'
import { createRouter, createWebHistory, type RouteRecordRaw, RouterView } from 'vue-router'

import { MenuEnum } from '@/enums/app'
import useUserStore from '@/stores/modules/user'

import { constantRoutes, INDEX_ROUTE_NAME, LAYOUT } from './routes'

// 匹配 views 里面所有的.vue文件，动态引入
const modules = import.meta.glob('/src/views/**/*.vue')

// 获取路由 key
export function getModulesKey() {
    return Object.keys(modules).map((item: string) =>
        item.replace('/src/views/', '').replace('.vue', '')
    )
}

// 过滤路由所需要的数据
export function filterAsyncRoutes(routes: any[], firstRoute = true) {
    return routes.map((route) => {
        const routeRecord = createRouteRecord(route, firstRoute)
        if (route.children != null && route.children && route.children.length) {
            routeRecord.children = filterAsyncRoutes(route.children, false)
        }
        return routeRecord
    })
}

// 创建一条路由记录
export function createRouteRecord(route: any, firstRoute: boolean): RouteRecordRaw {
    let path = ''
    if (route.type === MenuEnum.LINK) {
        path = route.url
    } else {
        path = firstRoute ? `/${route.routePath}` : route.routePath
    }
    // @ts-ignore
    const routeRecord: RouteRecordRaw = {
        path: path,
        name: Symbol(route.routePath),
        meta: {
            hidden: route.isShow !== 1,
            keepAlive: route.isCache === 1,
            title: route.name,
            perm: route.perm,
            query: route.param,
            icon: route.icon,
            type: route.type,
            url: route.url,
            activeMenu: route.selectedPath ? '/' + trim(route.selectedPath, '/') : ''
        }
    }
    switch (route.type) {
        case MenuEnum.CATALOGUE:
            routeRecord.component = firstRoute ? LAYOUT : RouterView
            if (!route.children) {
                routeRecord.component = RouterView
            }
            break
        case MenuEnum.MENU:
            routeRecord.component = loadRouteView(route.component)
            break
        case MenuEnum.IFRAME:
            routeRecord.component = () => import('@/layout/components/iframe.vue')
            break
        default:
            routeRecord.component = RouterView
    }
    return routeRecord
}

// 动态加载组件
export function loadRouteView(component: string) {
    try {
        const key = Object.keys(modules).find((key: string) => {
            return key.includes(`/${component}.vue`)
        })
        if (key) {
            return modules[key]
        }
        throw Error(`找不到组件 ${component} ，请确保组件路径正确`)
    } catch (error) {
        console.error(error)
        return RouterView
    }
}

// 找到第一个有效的路由
export function findFirstValidRoute(routes: RouteRecordRaw[]): string | undefined {
    for (const route of routes) {
        if (route.meta?.type === MenuEnum.MENU && !route.meta?.hidden) {
            return route.name as string
        }
        if (route.children) {
            const name = findFirstValidRoute(route.children)
            if (name) {
                return name
            }
        }
    }
}

// 重置路由
export function resetRouter() {
    router.removeRoute(INDEX_ROUTE_NAME)
    const { routes } = useUserStore()
    routes.forEach((route) => {
        const name = route.name
        if (name && router.hasRoute(name)) {
            router.removeRoute(name)
        }
    })
}

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: constantRoutes
})

export default router
