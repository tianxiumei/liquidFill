import React from 'react'
import ReactDOM from 'react-dom'
import VisualizationStore from 'liquidFill'
import * as inputRuleFuncs from 'liquidFill'
/* eslint import/no-webpack-loader-syntax: off */
import VisualizationStype from '!!raw-loader!liquidFill/dist/index.css'
/* eslint import/no-webpack-loader-syntax: off */
import visualizationConfigForm from '!!raw-loader!liquidFill/dist/form.xml'
import { account } from '../package.json'

const App = () => {
  return global['__Pandora__VisualizationAppRender'](
    VisualizationStore,
    visualizationConfigForm,
    VisualizationStype,
    inputRuleFuncs,
    account
  )
}
ReactDOM.render(<App />, document.getElementById('root'))
