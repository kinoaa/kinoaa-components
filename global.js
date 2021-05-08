import { getSTSCredentials } from '@/api/user'
export default {
  // 图片上传凭证
  clientData: {},
  // 视频上传凭证
  clientDataVideo: {},
  // 深克隆
  deepClone: function(obj) {
    if (typeof obj === 'object') {
      const result = Array.isArray(obj) ? [] : {}
      for (const item in obj) {
        result[item] = typeof (obj[item]) === 'object' ? this.deepClone(obj[item]) : obj[item]
      }
      return result
    } else {
      return obj
    }
  },
  /**
 *
 * 分页问题处理函数
 * @param {object} obj 分页数据里面需包含每页条数pageSize和当前页码pageNum
 * @param {number} abnormal 非正常分页，传入批量删除个数即可
 */
  base_page: function(obj, abnormal) {
    const total = obj.total
    if (abnormal) {
      // 批量删除完后分页问题
      // 拿到总数totalNumber和页码obj.pageNum以及每页条数obj.pageSize
      const moreNub = total % obj.pageSize// 取余
      let pageSize = obj.pageSize
      if (moreNub > 0) {
        pageSize = moreNub
      }
      if (abnormal === pageSize) {
        const page = Math.ceil(total / obj.pageSize)
        if (page === obj.pageNum && obj.pageNum > 1) {
          obj.pageNum = obj.pageNum - 1
        }
      }
    } else {
      // 正常单个删除完后分页问题
      const remainder = total % obj.pageSize
      const pageNum = Math.ceil(total / obj.pageSize)// 当前页码最后一页
      if (remainder === 1) {
        if (pageNum === obj.pageNum && obj.pageNum > 1) {
          obj.pageNum = obj.pageNum - 1
        }
      }
    }
  },
  /**
   * 压缩图片方法
   * @param {file} file 文件
   * @param {Number} quality 图片质量(取值0-1之间默认0.92)
   */
  compressImg(file, quality) {
    var qualitys = 0.25
    if (quality) {
      qualitys = quality
    }
    if (file[0]) {
      return Promise.all(Array.from(file).map(e => this.compressImg(e,
        qualitys))) // 如果是 file 数组返回 Promise 数组
    } else {
      return new Promise((resolve) => {
        const reader = new FileReader() // 创建 FileReader
        reader.onload = ({
          target: {
            result: src
          }
        }) => {
          const image = new Image() // 创建 img 元素
          image.onload = async() => {
            const canvas = document.createElement('canvas') // 创建 canvas 元素
            canvas.width = image.width
            canvas.height = image.height
            canvas.getContext('2d').drawImage(image, 0, 0, image.width, image.height) // 绘制 canvas
            const canvasURL = canvas.toDataURL('image/jpeg', qualitys)
            const buffer = atob(canvasURL.split(',')[1])
            let length = buffer.length
            const bufferArray = new Uint8Array(new ArrayBuffer(length))
            while (length--) {
              bufferArray[length] = buffer.charCodeAt(length)
            }
            const miniFile = new File([bufferArray], file.name, {
              type: 'image/jpeg'
            })
            console.log({
              file: miniFile,
              origin: file,
              beforeSrc: src,
              afterSrc: canvasURL,
              beforeKB: Number((file.size / 1024).toFixed(2)),
              afterKB: Number((miniFile.size / 1024).toFixed(2))
            })
            resolve({
              file: miniFile,
              origin: file,
              beforeSrc: src,
              afterSrc: canvasURL,
              beforeKB: Number((file.size / 1024).toFixed(2)),
              afterKB: Number((miniFile.size / 1024).toFixed(2))
            })
          }
          image.src = src
        }
        reader.readAsDataURL(file)
      })
    }
  },
  /**
   * 拿到阿里云凭证
   */
  getSts() {
    var str = localStorage.getItem('sts')
    var STS = JSON.parse(str)
    var now = new Date().getTime()
    if (str) {
      if (now - STS.timeout > 55 * 60 * 1000) {
        this.getAliSts()
      } else {
        this.clientData.accessKeyId = STS.data.accessKeyId
        this.clientData.region = 'oss-cn-shanghai'
        this.clientData.bucket = STS.data.bucketName
        this.clientData.stsToken = STS.data.securityToken
        this.clientData.accessKeySecret = STS.data.accessKeySecret
        // 传视频参数
        this.clientDataVideo = this.deepClone(this.clientData)
        if (process.env.VUE_APP_BASE_API2 === '') { // 测试服
          this.clientData.bucket = 'ly-dev'
          this.clientDataVideo.bucket = 'ly-dev-video'
        } else { // 正式服
          this.clientData.bucket = 'ly-prod'
          this.clientDataVideo.bucket = 'ly-prod-video'
        }
        // console.log(this.clientData, this.clientDataVideo)
      }
    } else {
      this.getAliSts()
    }
  },
  /**
   * 拿到阿里云凭证--调取接口
   */
  getAliSts() {
    getSTSCredentials().then(response => {
      if (response.succeed) {
        response.timeout = new Date().getTime()
        // 将数据保存在下来
        var dataStr = JSON.stringify(response)
        localStorage.setItem('sts', dataStr)
        this.clientData.accessKeyId = response.data.accessKeyId
        this.clientData.region = 'oss-cn-shanghai'
        this.clientData.stsToken = response.data.securityToken
        this.clientData.accessKeySecret = response.data.accessKeySecret
        // 传视频参数
        this.clientDataVideo = this.deepClone(this.clientData)
        if (process.env.VUE_APP_BASE_API2 === '') { // 测试服
          this.clientData.bucket = 'ly-dev'
          this.clientDataVideo.bucket = 'ly-dev-video'
        } else { // 正式服
          this.clientData.bucket = 'ly-prod'
          this.clientDataVideo.bucket = 'ly-prod-video'
        }
        // console.log(this.clientData, this.clientDataVideo)
      }
    })
  },
  /**
   *上传图片方法
   * @param {file} file 数组/单文件
   * @param {Boolean} isGif 是否为gif图片
   * @param {String} fileName 上传的文件夹名称，默认值images
   * @returns
   */
  uploadImg(file, isGif, fileName) {
    if (Array.isArray(file)) {
      return new Promise((resolve) => {
        Promise.all(Array.from(file).map(e => this.upload(e))).then(res => {
          resolve(res)
        })
      })
    } else {
      return new Promise((resolve) => {
        // eslint-disable-next-line no-undef
        var client = new OSS.Wrapper(this.clientData)
        var mime = file.name.split('.')[1]
        var storeName, contentType
        if (isGif) {
          storeName = `gif/${new Date().getFullYear()}/${addZero(new Date().getMonth() + 1)}/${addZero(new Date().getDate())}/${new Date().getFullYear() +
            addZero(new Date().getMonth() + 1) + addZero(new Date().getDate()) + addZero(new Date().getHours()) + addZero(new Date().getMinutes()) + addZero(new Date().getSeconds()) +
            addMinZroe(new Date().getMilliseconds()) + String(Math.random()).substr(2, 8)}.${mime}`
          contentType = 'image/gif'
        } else {
          let name = 'images'
          if (fileName) {
            name = fileName
          }
          storeName = `${name}/${new Date().getFullYear()}/${addZero(new Date().getMonth() + 1)}/${addZero(new Date().getDate())}/${new Date().getFullYear() +
          addZero(new Date().getMonth() + 1) + addZero(new Date().getDate()) + addZero(new Date().getHours()) + addZero(new Date().getMinutes()) + addZero(new Date().getSeconds()) +
          addMinZroe(new Date().getMilliseconds()) + String(Math.random()).substr(2, 8)}.${mime}`
          contentType = 'image/jpeg'
        }
        client.multipartUpload(storeName, file, { mime: contentType }).then(function(result) {
          console.log(result)
          result.name = '/' + result.name
          resolve(result)
        }).catch(function(err) {
          console.log(err)
        })
      })
    }
  },
  upload(file) {
    return new Promise((resolve) => {
      var client, storeName, contentType
      // eslint-disable-next-line no-undef
      client = new OSS.Wrapper(this.clientData)
      var mime = file.name.split('.')[1]
      if (file.type.includes('video')) {
        storeName = `videos/${new Date().getFullYear()}/${addZero(new Date().getMonth() + 1)}/${addZero(new Date().getDate())}/${new Date().getFullYear() +
          addZero(new Date().getMonth() + 1) + addZero(new Date().getDate()) + addZero(new Date().getHours()) + addZero(new Date().getMinutes()) + addZero(new Date().getSeconds()) +
          addMinZroe(new Date().getMilliseconds()) + String(Math.random()).substr(2, 8)}.${mime}`
        contentType = 'video/mp4'
      } else {
        storeName = `images/${new Date().getFullYear()}/${addZero(new Date().getMonth() + 1)}/${addZero(new Date().getDate())}/${new Date().getFullYear() +
        addZero(new Date().getMonth() + 1) + addZero(new Date().getDate()) + addZero(new Date().getHours()) + addZero(new Date().getMinutes()) + addZero(new Date().getSeconds()) +
        addMinZroe(new Date().getMilliseconds()) + String(Math.random()).substr(2, 8)}.${mime}`
        contentType = 'image/jpeg'
      }
      client.multipartUpload(storeName, file, { mime: contentType }).then(function(result) {
        console.log(result)
        result.name = '/' + result.name
        resolve(result)
      }).catch(function(err) {
        console.log(err)
      })
    })
  },
  /**
 *键值对过滤器--过滤掉没有值的参数
 * @param {Array} param
 */
  filterArray(param) {
    Object.keys(param).forEach(function(key) {
      if (param[key] === '') {
        delete param[key]
      }
    })
    return param
  },
  /**
   *视频格式h264判断
   * @param {file} file 单文件
   * @returns Promise
   */
  baseVideoInfo(file) {
    return new Promise((resolve) => {
      // eslint-disable-next-line no-undef
      MediaInfo({ format: 'object' }, (mediainfo) => { // format结果值的格式（选择：object，JSON，XML，HTML或text）
        if (file) {
          const getSize = () => file.size
          const readChunk = (chunkSize, offset) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = (event) => {
                if (event.target.error) {
                  reject(event.target.error)
                }
                resolve(new Uint8Array(event.target.result))
              }
              reader.readAsArrayBuffer(file.slice(offset, offset + chunkSize))
            })
          mediainfo.analyzeData(getSize, readChunk).then((result) => {
            // result.media.track[1].Format == "AVC"说明是h264
            resolve(result)
          }).catch((error) => {
            console.log(error)
          })
        }
      })
    })
  },
  /**
   * 视频截取封面
   * @param {file} file 单文件
   * @returns Promise
   */
  handleVideo(file) {
    return new Promise((resolve) => {
      // debugger
      var videoUrl = window.URL.createObjectURL(file)
      var video = document.createElement('video')
      video.setAttribute('id', 'video')
      video.src = videoUrl
      // 让视频自动播放来来获取宽高和缩略图
      video.autoplay = true
      video.muted = true
      document.getElementById('newsVideo').innerHTML = ''
      console.log(document.getElementById('newsVideo'))
      document.getElementById('newsVideo').appendChild(video)
      // 当video加载完成时获取的
      var videoHeight, videoWidth
      video.onloadedmetadata = function() {
        videoHeight = video.offsetHeight
        videoWidth = video.offsetWidth
      }
      video.play()
      video.ontimeupdate = function() {
        var canvas = document.createElement('canvas')
        canvas.width = videoWidth
        canvas.height = videoHeight
        var context = canvas.getContext('2d')
        context.fillStyle = '#000'
        context.drawImage(this, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height)
        var src = canvas.toDataURL('image/jpeg', 0.3)
        // 将视频的缩略图渲染到页面中
        if (src !== 'data:,') {
        // var dynamicImg = new Image()
        // dynamicImg.src = src
        // 将压缩的后的图片渲染到页面中
          this.ontimeupdate = null
          const imgFile = dataURLtoFile(src, 'thumbnailImg.jpeg')
          const data = {
            src: src, // 回显url
            file: imgFile// 封面文件
          }
          resolve(data)
          // 清空创造的video标签，避免造成性能浪费以及报错
          document.getElementById('newsVideo').innerHTML = ''
          // 加载完成后销毁url，节省性能
          window.URL.revokeObjectURL(videoUrl)
        }
      }
    })
  },
  /**
   * 视频url截取
   * @param {String} url 地址
   * @returns Promise
   */
  getUrl(url) {
    if (url) {
      var disLength = url.length
      const index = url.lastIndexOf('.com')
      var result = url.substring(index + 4, disLength)
      return result
    }
  }
}
// 加零函数
function addZero(num) {
  if (num < 10) {
    return '0' + num
  } else {
    return String(num)
  }
}
function addMinZroe(num) {
  if (num < 100 && num >= 10) {
    return '0' + num
  } else if (num < 10) {
    return '00' + num
  } else {
    return num
  }
}
// 将dataURL转化为file对象的函数
function dataURLtoFile(dataurl, filename) {
  var arr = dataurl.split(','); var mime = arr[0].match(/:(.*?);/)[1]
  var bstr = atob(arr[1]); var n = bstr.length; var u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

