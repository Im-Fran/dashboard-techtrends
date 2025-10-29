import {createBrowserRouter} from "react-router";

import { Home } from "@/pages/home";
import { TablePage } from "@/pages/table";
import { StatsPage } from "@/pages/stats";
import {Layout} from "@/components/layout.tsx";

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      {
        index: true,
        Component: Home,
      },
      {
        path: 'tabla',
        Component: TablePage,
      },
      {
        path: 'estadisticas',
        Component: StatsPage,
      }
    ]
  }
])