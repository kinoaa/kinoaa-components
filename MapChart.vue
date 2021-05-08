<template>
  <div id="echarts-map" :class="className" :style="{height:height,width:width}">
    <div class="map-loading">
      <div class="run-loader" />
    </div>
  </div>
</template>

<script>
import echarts from 'echarts'
require('echarts/theme/macarons') // echarts theme
import resize from './mixins/resize'

export default {
  mixins: [resize],
  props: {
    className: {
      type: String,
      default: 'echarts-map'
    },
    width: {
      type: String,
      default: '100%'
    },
    height: {
      type: String,
      default: '1018px'
    },
    autoResize: {
      type: Boolean,
      default: true
    },
    chartData: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      chart: null
    }
  },
  watch: {
    chartData: {
      deep: true,
      handler(val) {
        this.getMap(val)
        // console.log(val)
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      // this.initChart()

      // console.log(this.chartData)
    })
  },
  beforeDestroy() {
    if (!this.chart) {
      return
    }
    this.chart.dispose()
    this.chart = null
  },
  methods: {
    getMap(mapData) {
      const arr = []
      mapData.forEach(function(item) {
        var obj = {
          name: item.city,
          value: [
            item.lon,
            item.lat,
            item.val
          ]
        }
        arr.push(obj)
      })
      // 拿到数据转化好 echarts的所需的数据后 调用initMap函数 并将数据传入
      var echartsMap = document.querySelector('.echarts-map')
      echarts.init(echartsMap)
      this.initMap(arr)
    },
    initMap(res) {
      var myChart = echarts.init(document.getElementById('echarts-map'))
      myChart.setOption({
        title: {
          text: '当日活跃用户地域分布图',
          left: 'center',
          top: 10,
          textStyle: {
            color: '#000',
            fontSize: '25'
          }
        },
        amap: {
          // center: [103.4590412100, 35.8448593900],
          center: [103.4590412100, 36.3948593900],
          zoomEnable: false,
          dragEnable: false,
          maxPitch: 60,
          pitch: 10, // 45 俯仰角
          viewMode: '3D',
          zoom: 5,
          expandZoomRange: true,
          zooms: [4.9, 20],
          mapStyle: 'amap://styles/a47e13cfd8f50d3763ce1c09601c8450', // 地图主题
          rotation: 0, // 顺时针旋转角度
          resizeEnable: true
        },
        tooltip: {
          trigger: 'item',
          zlevel: 100,
          formatter: function(params) {
            // 提示中显示的数据的处理函数
            var toolTiphtml = ''
            for (var i = 0; i < res.length; i++) {
              if (params.name === res[i].name) {
                toolTiphtml += res[i].name + ' :  ' + res[i].value[2]
              }
            }
            return toolTiphtml
          }
        },
        // 工具箱
        toolbox: {
          show: true,
          orient: 'vertical',
          left: '98%',
          top: 'center',
          zlevel: 60,
          z: 200,
          // feature: {
          // 	dataView: { readOnly: false },
          // 	restore: {},
          // 	saveAsImage: {}
          // },
          feature: {
            dataView: {
              show: true,
              readOnly: true,
              lang: ['', '关闭'],
              optionToContent: function(opt) {
                // console.log(opt)
                var axisData = opt.data // 坐标数据
                var series = opt.series // 折线图数据
                // var tdHeads = '<td  style="padding: 0 10px">用户分布</td>'; //表头
                var tdHeads = ''
                var tdBodys = ''; // 数据
                ['用户分布地区', '经度', '纬度', '人数'].forEach(function(item) {
                  // 组装表头
                  tdHeads += '<td style="padding: 0 10px">' + item +
									'</td>'
                })
                var table = '<table class="bar_table" border="1" style="width:100%;text-align:center;line-height: 35px;border-collapse:collapse;""><tbody><tr>' + tdHeads + '</tr>'
                for (var i = 0, l = axisData.length; i < l; i++) {
                  // for (var j = 0; j < series.length; j++) {
                  // 组装表数据
                  tdBodys += '<td>' + series[0].data[i].name + '</td>'
                  tdBodys += '<td>' + series[0].data[i].value[0] + '</td>'
                  tdBodys += '<td>' + series[0].data[i].value[1] + '</td>'
                  tdBodys += '<td>' + series[0].data[i].value[2] + '</td>'
                  // }
                  table += '<tr>' + tdBodys + '</tr>'
                  tdBodys = ''
                }
                table += '</tbody></table>'
                return table
              },
              contentToOption: function(HTMLDomElement, opt) {
                return opt
              }
            },
            // magicType: {type: ['line', 'bar'],show: true},
            restore: { show: true },
            saveAsImage: { show: true }
          },
          textStyle: {
            color: '#fff'
          }
        },
        legend: {
          orient: 'vertical',
          top: 'bottom',
          left: 'right',
          data: ['用户在线数量'],
          textStyle: {
            color: '#fff'
          }
        },
        visualMap: {
          type: 'piecewise',
          left: 'right',
          // dimension: 0,
          // show: false,
          pieces: [
            {
              gte: 0,
              lt: 50
              // color: '#00cc3e'
            },
            {
              gte: 50,
              lt: 100
              // color: '#edee02'
            },
            {
              gt: 100
              // color: '#ec0202'
            }
          ],
          // minOpen: false,
          // maxOpen: false,
          color: ['#ec0202', '#edee02', '#00cc3e']
          // textStyle: {
          // 	color: '#fff',
          // },
        },
        data: res,
        animation: true
      })
      // 上面的部分是echarts的配置，需要注意的是amap，这里的配置就是针对 高德地图 的配置了，而支持哪些配置
      // 可以去高德地图的开发平台去查看
      // var map = new AMap.Map('container', {
      //   zoom: 12,
      //   center: [103.4590412100, 35.8448593900]
      // })

      var map = myChart.getModel().getComponent('amap').getAMap()
      // console.log(myChart.getModel().getComponent('amap'))

      var layer = map.getLayers()

      var series = [
        {
          name: '用户分布',
          // type: 'effectScatter',
          type: 'scatter',
          hoverAnimation: true,
          coordinateSystem: 'amap',
          // 数据载入，这里需要自己定义自己的数据，主要是[{name : ***, value : ***}]
          data: res,
          symbolSize: 8,
          // 配置标签的显示
          label: {
            // normal: {
            // 	formatter: '{b}',
            // 	position: 'right',
            // 	show: true
            // },
            emphasis: {
              show: false
            },
            showEffectOn: 'render',
            large: true,
            effectType: '',
            rippleEffect: { // 涟漪特效相关配置。
              period: 0, // 动画的时间。
              scale: 0, // 动画中波纹的最大缩放比例。
              brushType: 'fill' // 波纹的绘制方式，可选 'stroke' 和 'fill'。
            }
          }
        }
      ]

      myChart.setOption({
        series: series
      })

      // 下面是确保高德地图渲染的时候，echarts同时也需要再次渲染一次，保持位置的同步
      layer.render = function() {
        myChart.setOption({
          series: series
        })
      }
    }
  }
}
</script>
<style lang="scss" scoped>
/* 地图中的loading动画 */

.map-loading {
	position: relative;
	width: 100%;
	height: 750px;
	z-index: 10;
}

.run-loader {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 50px;
	height: 50px;
	box-sizing: border-box;
	border: 5px solid #409eff;
	border-right-color: transparent;
	border-radius: 50%;
	animation: loader-rotate 1s linear infinite;
}

@keyframes loader-rotate {
	0% {
		transform: rotate(0);
	}
	100% {
		transform: rotate(360deg);
	}
}
</style>
