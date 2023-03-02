import {
  defineComponent, reactive, computed, onMounted, watch, onUnmounted
} from 'vue'
const props = {
  start: {
    type: Number,
    required: false,
    default: 0
  },
  end: {
    type: Number,
    required: false,
    default: 0
  },
  duration: {
    type: Number,
    required: false,
    default: 5000
  },
  autoPlay: {
    type: Boolean,
    required: false,
    default: true
  },
  decimals: {
    type: Number,
    required: false,
    default: 0,
    validator(value) {
      return value >= 0
    }
  },
  decimal: {
    type: String,
    required: false,
    default: '.'
  },
  separator: {
    type: String,
    required: false,
    default: ','
  },
  prefix: {
    type: String,
    required: false,
    default: ''
  },
  suffix: {
    type: String,
    required: false,
    default: ''
  },
  useEasing: {
    type: Boolean,
    required: false,
    default: true
  },
  easingFn: {
    type: Function,
    default(t, b, c, d) {
      return c * (-Math.pow(2, -10 * t / d) + 1) * 1024 / 1023 + b
    }
  }
}
export default defineComponent({
  name: 'CountTo',
  props: props,
  emits: ['onMountedcallback', 'callback'],
  setup(props, {emit}) {
    const isNumber = (val) => {
      return !isNaN(parseFloat(val))
    }
    // 格式化数据，返回想要展示的数据格式
    const formatNumber = (val) => {
      val = val.toFixed(props.decimals)
      val += ''
      const x = val.split('.')
      let x1 = x[0]
      const x2 = x.length > 1 ? props.decimal + x[1] : ''
      const rgx = /(\d+)(\d{3})/
      if (props.separator && !isNumber(props.separator)) {
        while (rgx.test(x1)) {
          x1 = x1.replace(rgx, '$1' + props.separator + '$2')
        }
      }
      return props.prefix + x1 + x2 + props.suffix
    }
    const state = reactive<{
      localStart: number
      displayValue: number|string
      printVal: any
      paused: boolean
      localDuration: any
      startTime: any
      timestamp: any
      remaining: any
      rAF: any
    }>({
      localStart: props.start,
      displayValue: formatNumber(props.start),
      printVal: null,
      paused: false,
      localDuration: props.duration,
      startTime: null,
      timestamp: null,
      remaining: null,
      rAF: null
    })
    // 定义一个计算属性，当开始数字大于结束数字时返回true
    const stopCount = computed(() => {
      return props.start > props.end
    })
    const startCount = () => {
      state.localStart = props.start
      state.startTime = null
      state.localDuration = props.duration
      state.paused = false
      state.rAF = requestAnimationFrame(count)
    }

    watch(() => props.start, () => {
      if (props.autoPlay) {
        startCount()
      }
    })

    watch(() => props.end, () => {
      if (props.autoPlay) {
        startCount()
      }
    })
    // dom挂在完成后执行一些操作
    onMounted(() => {
      if (props.autoPlay) {
        startCount()
      }
      emit('onMountedcallback')
    })
    const count = (timestamp) => {
      if (!state.startTime) state.startTime = timestamp
      state.timestamp = timestamp
      const progress = timestamp - state.startTime
      state.remaining = state.localDuration - progress
      // 是否使用速度变化曲线
      if (props.useEasing) {
        if (stopCount.value) {
          state.printVal = state.localStart - props.easingFn(progress, 0, state.localStart - props.end, state.localDuration)
        } else {
          state.printVal = props.easingFn(progress, state.localStart, props.end - state.localStart, state.localDuration)
        }
      } else {
        if (stopCount.value) {
          state.printVal = state.localStart - ((state.localStart - props.end) * (progress / state.localDuration))
        } else {
          state.printVal = state.localStart + (props.end - state.localStart) * (progress / state.localDuration)
        }
      }
      if (stopCount.value) {
        state.printVal = state.printVal < props.end ? props.end : state.printVal
      } else {
        state.printVal = state.printVal > props.end ? props.end : state.printVal
      }

      state.displayValue = formatNumber(state.printVal)
      if (progress < state.localDuration) {
        state.rAF = requestAnimationFrame(count)
      } else {
        emit('callback')
      }
    }
    // 组件销毁时取消动画
    onUnmounted(() => {
      cancelAnimationFrame(state.rAF)
    })
    return () => (
      state.displayValue
    )
  }
})
