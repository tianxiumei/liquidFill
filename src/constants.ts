export enum DataType{
  Current = 'current',
  Secondary = 'secondary',
  Total = 'total',
  Max = 'max',
  Min = 'min',
  Average = 'average'
}

export interface IConfig{
  dataType:DataType
  metric:string
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
}