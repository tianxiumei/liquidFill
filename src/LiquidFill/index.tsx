import * as  React from 'react'
import { get, findIndex, find, sum, min, max, floor, mean, zip } from 'lodash'
import ReactEcharts from 'echarts-for-react'
import { BasicFieldDataType, FieldDataItem, IField } from '@qn-pandora/visualization-sdk'
import { DataType, IConfig, IPercentage } from '../constants'

import './style.less'

interface ILiquidFillProps {
    dataset: any
    config: IConfig
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


    getData(): BasicFieldDataType[][] {
        const { metrics } = this.props.config
        const rows = this.props.dataset.rows as FieldDataItem[]
        const fields = this.props.dataset.fields as IField[]
        const realMetric = metrics && metrics.length > 0 ? metrics.map((metric) => find(fields, (field) => field.name === metric)) : []
        const currentMetrics = realMetric && realMetric.length > 0 ? realMetric :[] as IField[]
        if (currentMetrics.length > 0) {
            const dataIndexs = currentMetrics.map((metric) => findIndex(fields, metric))
            const data = rows.map((row) => {
                return dataIndexs.map((index) => row[index])
            })
            return data
        }
        return []
    }

    getcurrentData = (data: any) => {
        const dataType = this.props.config.dataType ? this.props.config.dataType : DataType.Current
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

    displayDataFormatter = (param: any) => {
        const value = param.value
        const { percentage, decimal } = this.props.config
        if (!isNaN(value)) {
            switch (percentage) {
                case IPercentage.PercentageOne:
                    return `${floor(param.value, decimal || 2)}%`
                case IPercentage.PercentageTwo:
                    return `${floor(param.value * 100, decimal || 2)}%`
                default:
                    return `${floor(param.value * 100, decimal || 2)}%`
            }
        }
        return '--'
    }

    displayData = () => {
        const data = this.getData()
        if (data.length === 0) {
            return []
        }
        const { config} = this.props
        const zipData = zip(...data)
        const realMetric = config.metrics && config.metrics.length > 0 ? config.metrics : []
        return zipData.map((item, index) => {
            const name = realMetric ? realMetric[index] :''
            return ({
                name,
                value: this.getcurrentData(item),
                direction: get(config, 'direction') || 'left',
                itemStyle: {
                    color: get(config, 'waveColor') || '#2c6dd2'
                }
            })
        })

    }

    getOption = () => {
        const data = this.displayData()
        const { config } = this.props
        const amplitude = get(config, 'amplitude')
        const outlineShow = get(config, 'outlineShow')
        const option = {
            tooltip: {
                show: true,
                formatter: (param: any) => {
                    const name = get(param, 'name') || ''
                    const value = get(param, 'value') || ''
                    return `<span>${name}:${value}</span>`
                }
            },
            series: [{
                type: 'liquidFill',
                radius: '90%',
                shape: get(config, 'shape') || 'circle',
                backgroundStyle: {
                    shadowColor: 'rgba(0, 0, 0, 0.4)',
                    borderWidth: 1,
                    color: get(config, 'backgroundColor') ||'#ffffff'
                },
                label: {
                    fontSize: get(config, 'fontSize') || 50,
                    formatter: (param: any) => this.displayDataFormatter(param),
                    color: get(config, 'outColor') || '#2c6dd2',
                    insideColor: get(config, 'insideColor') || '#ffffff',
                },
                data,
                amplitude: amplitude || amplitude === 0 ? amplitude : 9,
                tooltip: {
                    show: true
                },
                outline: {
                    show: outlineShow ? outlineShow === 'false' ? false : true : true,
                    itemStyle: {
                        borderWidth: get(config,'borderWidth')||5,
                        borderColor: get(config, 'outlineBorderColor') || '#156ACF',
                        shadowColor:get(config,'shadowColor') ||'#ffffff'
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