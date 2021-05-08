<template>
  <div class="upload-container">
    <div v-show="headImg===''" class="bgImg" @click="uploadWall()">
      <div class="tip">
        <i class="el-icon-upload" />
      </div>
    </div>
    <div v-show="headImg!==''" class="show-img">
      <img width="100" height="100" class="reference-img" :src="headImg">
      <i class="icon el-icon-error" @click="deleteAddImg" />
    </div>
    <input id="fileInput" accept="image/*" width="0" height="0" type="file" @change="changeFile">
  </div>
</template>

<script>

export default {
  name: 'SingleImageUpload',
  props: {
    imageUpload: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      headImg: '',
      headFile: ''
    }
  },
  computed: {
    imageUrl() {
      return this.value
    }
  },
  watch: {
    imageUpload(val) {
      if (val) {
        this.headImg = ''
      }
    }
  },
  created() {
    // 阿里云凭证
    this.$global.getSts()
  },
  methods: {
    // 触发事件
    uploadWall() {
      document.getElementById('fileInput').value = ''
      document.getElementById('fileInput').click()
    },
    // 背景图
    changeFile(e) {
      // 加载完成后销毁url，节省性能
      if (this.headImg !== '') {
        window.URL.revokeObjectURL(this.headImg)
      }
      this.$global.compressImg(e.target.files[0]).then(res => {
        const file = res.file
        if (file.size > 20 * 1024 * 1024) {
          this.$message.error('图片过大')
        } else {
          this.headImg = window.URL.createObjectURL(file)
          this.headFile = file
          this.$emit('childMsg', { image: true, file: file })
        }
      })
    },
    deleteAddImg() {
      window.URL.revokeObjectURL(this.headImg)
      this.headImg = ''
      this.$emit('childMsg', { image: true, file: '' })
    }
  }
}
</script>

<style lang="scss" scoped>
#fileInput{
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
  }
}
.reference-img{
  border-radius: 4px;
}
</style>
