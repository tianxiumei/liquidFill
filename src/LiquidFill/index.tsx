import * as  React from 'react'
import ReactEcharts from 'echarts-for-react'
import './style.less'
import { BasicFieldDataType, FieldDataItem, IField } from '@qn-pandora/visualization-sdk'
import { size, get, findIndex, find, sum, toNumber, min, max, floor, mean } from 'lodash'
import { DataType, IConfig } from '../constants'
interface ILiquidFillProps {
    dataset: any
    config:IConfig
}
export class LiquidFill extends React.Component<ILiquidFillProps> {
    constructor(props: ILiquidFillProps) {
        super(props)

    }


    getMetrics(fields: any[]) {
        return fields.filter(field => field.flag === 'metric')
    }

    getFieldIndex(field: string, fields: IField[]) {
        return findIndex(fields, item => item && item.name === field)
    }


    getData(): BasicFieldDataType[] {
        const {metric}=this.props.config
        const rows = this.props.dataset.rows as FieldDataItem[]
        const fields = this.props.dataset.fields as IField[]
        const metrics =  this.getMetrics(fields)
        const realMetric=find(fields,(field)=>field.name===metric)
        const currentMetrics = realMetric?[realMetric]:metrics.map(metric => find(fields, (field: any) => field.name === metric.name))
            .filter(metric => !!metric) as IField[]
        const currentMetricKey =metric?metric: get(currentMetrics, [0, 'name'])
        if (size(currentMetrics) > 0 && size(fields) > 0 && size(rows) > 0) {
            const metricIndex = this.getFieldIndex(currentMetricKey, fields)
            return rows.map(row => get(row, metricIndex))
        }
        return []
    }

    getcurrentData() {
        const data = this.getData()
        const dataType=this.props.config.dataType?this.props.config.dataType:DataType.Current
        switch (dataType) {
            case DataType.Current:
                return data[0]
            case DataType.Secondary:
                return data[1]
            case DataType.Min:
                return min(data)
            case DataType.Max:
                return max(data)
            case DataType.Average:
                return floor(mean(data))
            case DataType.Total:
                return sum(data)
        }
    }

    displayDataFormatter() {
        const currentData = toNumber(this.getcurrentData())
        if (!isNaN(currentData)) {
            return currentData
        }
        return '--'
    }


    getOption = () => {
        const{config}=this.props
        const amplitude=get(config,'amplitude') 
        const outlineShow=get(config,'outlineShow')
        const option = {
            series: [{
                type: 'liquidFill',
                radius: '90%',
                shape:get(config,'shape')  ||'circle',
                backgroundStyle: {
                    borderWidth: 1,
                    color: get(config,'backgroundColor')|| '#ffff'
                },
                label: {
                    normal: {
                        formatter: () => this.displayDataFormatter(),
                        textStyle: {
                            fontSize:get(config,'fontSize')|| 50
                        }
                    }
                },
                data: [{
                    value: 0.6,
                    direction:get(config,'direction')|| 'left', 
                    itemStyle: {
                        color: get(config,'waveColor')||'#2c6dd2'
                    }
                }, {
                    value: 0.5,
                    direction:get(config,'direction')|| 'left', 
                    itemStyle: {
                        color: get(config,'waveColor')||'#2c6dd2'
                    }
                }, {
                    value: 0.4,
                    direction:get(config,'direction')|| 'left', 
                    itemStyle: {
                        color: get(config,'waveColor')||'#2c6dd2'
                    }
                }, {
                    value: 0.3,
                    direction:get(config,'direction')|| 'left', 
                    itemStyle: {
                        color: get(config,'waveColor')||'#2c6dd2'
                    }
                }],
                amplitude:amplitude||amplitude===0?amplitude: 9,
                tooltip: {
                    show: true
                },
                outline: {
                    show:outlineShow?outlineShow==='false' ?false:true:true,
                    itemStyle: {
                        borderColor: get(config,'outlineBorderColor')|| '#156ACF',
                    }
                }
            }]
        }
        return option
    }

    render() {
        return <ReactEcharts
            className="liquidFill"
            option={this.getOption()}
            theme="pandora-light"
            notMerge={true}
        />
    }
}