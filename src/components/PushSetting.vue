<template>
  <div class="main">
    <el-divider>Push</el-divider>
    <el-row :gutter="12">
      <el-col :span="8" :offset="8">
        <el-input placeholder="请输入 uid" v-model="uid" class="input-with-select">
          <el-button slot="append" icon="el-icon-search" @click="fetch"></el-button>
        </el-input>
      </el-col>
    </el-row>
    <el-row :gutter="12">
      <el-col :span="6" :offset="6">
        <p>
          <b>系统开关:</b>
          {{settings.system === 1 ? "关闭" : (settings.system === 2 ? "开启" : "")}}
        </p>
        <p>
          <b>APP ID:</b>
          {{settings.token.appId + ' ' + platfrom(settings.token.appId)}}
        </p>
        <p>
          <b>推送平台:</b>
          {{pushProviderConfig[settings.token.platformCode]}}
        </p>
        <p>
          <b>创建时间:</b>
          {{settings.token.create_time}}
        </p>
        <p>
          <b>修改时间:</b>
          {{settings.token.update_time}}
        </p>
      </el-col>
      <!-- app 内设置 -->
      <el-col :span="6">
        <p v-for="(item, i) in settings.setting" :key="i">
          <b>{{appSettingConfig[item.type]}}:</b>
          {{item.status ? "打开":"关闭"}}
        </p>
      </el-col>
    </el-row>
    <el-row :gutter="12">
      <el-col :span="12" :offset="6">
        <p>
          <b>TOKEN:</b>
          {{settings.token.token}}
        </p>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "PushSetting",
  data() {
    return {
      uid: "",
      pushProviderConfig: {
        "50": "苹果",
        "1": "小米",
        "2": "华为",
        "3": "魅族",
        "4": "Oppo",
        "5": "Vivo"
      },
      appSettingConfig: {
        "1": "接收广场动态通知",
        "2": "接收朋友圈通知",
        "3": "通知显示消息内容",
        "4": "守护的人上线提醒",
        "7": "好友开播消息通知",
        "8": "关注的房间开播消息通知"
      },
      settings: {
        setting: [],
        system: undefined,
        token: {
          appId: "",
          token: "",
          platformCode: undefined,
          create_time: "",
          update_time: ""
        }
      }
    };
  },
  methods: {
    fetch() {
      if (
        !this.uid ||
        !isNaN(this.uid) ||
        (this.uid.length != 8 && this.uid.length != 9)
      ) {
        this.$message.error("uid 输入有误");
        return;
      }
      axios
        .get(
          "http://testmanager.wb-intra.com/push-manager/setting/user?uid=" +
            this.uid
        )
        .then(resp => {
          this.settings = resp.data.data;
        });
    },
    platfrom(appId) {
      if (appId == 10001 || appId == 10000) {
        return "iOS";
      }
      if (appId == 10002) {
        return "Android";
      }
      if (appId.startsWith("2")) {
        return "Android";
      }
      if (appId.startsWith("3")) {
        return "iOS";
      }
      return "";
    }
  }
};
</script>

<style scoped>
.main {
  text-align: left;
}
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: black;
  /* cursor: default; */
  text-decoration: none;
}
.el-card {
  margin-top: 6px;
  margin-bottom: 6px;
}
</style>
