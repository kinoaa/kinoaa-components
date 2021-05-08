<template>
  <div class="upload-container">
    <div id="newsVideo" style="opacity:0;width: 0;height: 0;overflow: hidden;" />
    <div v-show="videoImg===''" class="bgImg" @click="uploadWall()">
      <div class="tip">
        <i class="el-icon-upload" />
      </div>
    </div>
    <div v-show="videoImg!==''" class="show-img">
      <img width="100" height="100" class="reference-img" :src="videoImg">
      <i class="icon el-icon-error" @click="deleteAddImg" />
      <div class="edit_cover" @click="editCover">编辑封面</div>
      <img v-show="coverImg!==''" width="100" height="100" class="reference-img cover-img" :src="coverImg">
    </div>
    <input id="fileInput" accept="video/*" width="0" height="0" type="file" @change="changeFile">
    <input id="fileInputImg" accept="image/*" width="0" height="0" type="file" @change="changeCover">
  </div>
</template>

<script>

export default {
  name: 'SingleVideoUpload',
  props: {
    videoUpload: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      videoImg: '',
      videoImgFile: '',
      videoFile: '',
      videoInfo: {},
      coverImg: '',
      coverFile: ''
    }
  },
  computed: {
    imageUrl() {
      return this.value
    }
  },
  watch: {
    videoUpload(val) {
      if (val) {
        this.videoImg = ''
        this.videoImgFile = ''
        this.videoFile = ''
        this.videoInfo = {}
        this.coverImg = ''
        this.coverFile = ''
      }
    }
  },
  created() {
    // 阿里云凭证
    this.$global.getSts()
  },
  methods: {
    // 触发事件
    uploadWall(id) {
      document.getElementById('fileInput').value = ''
      document.getElementById('fileInput').click()
    },
    // 视频
    changeFile(e) {
      // 加载完成后销毁url，节省性能
      if (this.videoImg !== '') {
        window.URL.revokeObjectURL(this.videoImg)
      }
      const file = e.target.files[0]
      if (file.type === 'video/mp4') { // 视频
        this.$global.baseVideoInfo(file, this).then(res => {
          console.log(res)
          if (res.media.track[1].Format !== 'AVC') {
            this.$message({
              type: 'error',
              message: '请选择视频编码为h.264的视频上传'
            })
            return
          }
          if (res.media.track[1].Duration < 60) {
            this.$message({
              type: 'error',
              message: '视频时长最短1分钟,请重新选择'
            })
            return
          }
          if (file.size > 3 * 1024 * 1024 * 1024) {
            this.$message({
              type: 'error',
              message: '视频过大，请重新选择'
            })
            return
          }
          const time = Math.floor(res.media.track[1].Duration)
          this.videoInfo = {
            duration: time,
            width: Number(res.media.track[1].Width),
            height: Number(res.media.track[1].Height)
          }
          this.$global.handleVideo(file).then(res => {
            console.log(res)
            this.videoImg = res.src// 视频封面图回显
            this.videoImgFile = res.file// 视频封面图文件
            this.videoFile = file// 视频文件
            this.$emit('childMsg', {
              video: true,
              videoInfo: this.videoInfo,
              videoImgFile: res.file,
              videoFile: file
            })
          })
        })
      } else {
        this.$message.error('请选择mp4格式的视频上传')
      }
    },
    // 删除
    deleteAddImg() {
      window.URL.revokeObjectURL(this.videoImg)
      window.URL.revokeObjectURL(this.coverImg)
      this.videoImg = ''
      this.videoImgFile = ''
      this.videoFile = ''
      this.videoInfo = {}
      this.coverImg = ''
      this.coverFile = ''
      this.$emit('childMsg', { delete: true })
    },
    // 编辑封面
    editCover() {
      document.getElementById('fileInputImg').value = ''
      document.getElementById('fileInputImg').click()
    },
    // 上传封面
    changeCover(e) {
      if (this.coverImg !== '') {
        window.URL.revokeObjectURL(this.coverImg)
      }
      this.$global.compressImg(e.target.files[0]).then(res => {
        const file = res.file
        if (file.size > 20 * 1024 * 1024) {
          this.$message.error('图片过大')
        } else {
          const img = window.URL.createObjectURL(file)
          this.coverImg = img
          this.coverFile = file
          this.$emit('childMsg', {
            cover: true,
            coverFile: file
          })
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
#fileInput,#fileInputImg{
  opacity: 0;
  width: 1px;
  height: 1px;
  display: inherit;
}
.bgImg{
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  border:solid .5px #ccc;
  border-radius: 4px;
  .tip{
    text-align: center;
    i{
      font-size: 40px;
    }
  }
}
.show-img{
  width: 100px;
  height: 100px;
  position: relative;
  .icon{
    position: absolute;
    top: -10px;
    right: -12px;
    font-size: 16px;
    z-index: 1200;
  }
  .edit_cover{
    line-height: normal;
    cursor: pointer;
    position: absolute;
    padding: 3px;
    font-size: 12px;
    bottom: 10px;
    right: 10px;
    border-radius: 8px;
    background-color: rgba(0, 0, 0, 0.2);
    border: 0.8px solid rgba(255, 255, 255, 1);
    color: #fff;
    z-index: 1200;
  }
}
.reference-img{
  border-radius: 4px;
}
.cover-img{
  position: absolute;
  left: 0;
}
</style>
