export enum DataType{
  Current = 'current',
  Secondary = 'secondary',
  Total = 'total',
  Max = 'max',
  Min = 'min',
  Average = 'average'
}

export enum IPercentage{
  PercentageOne='percentageOne',
  PercentageTwo='percentageTwo'
}

export interface IConfig{
  dataType:DataType
  metrics:string[]
  bucket:string
  backgroundColor:string
  shape:string
  outlineShow:string
  outlineBorderColor:string
  fontSize:number
  amplitude:number
  waveColor:string
  direction:string
  insideColor:string
  outColor:string
  percentage:IPercentage
  decimal:number
  borderWidth:number
}