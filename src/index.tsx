import * as React from "react";
import * as ReactDom from "react-dom";
import {
  VisualizationBase, OutputMode,
} from "@qn-pandora/visualization-sdk";
import "echarts-liquidfill";
import { LiquidFill } from "./LiquidFill";
import { IConfig } from "./constants";

export default class VisualizationStore extends VisualizationBase {
  getInitialDataParams() {
    return {
      outputMode: OutputMode.JsonRows,
      count: 10000
    }
  }


  updateView(dataset: any,config:IConfig) {
    console.log('dataset::',dataset)
    ReactDom.render(
      <LiquidFill dataset={dataset} config={config} />,
      this.element
    );
  }
}
