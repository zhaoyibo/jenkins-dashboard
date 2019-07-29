<template>
  <div class="main">
    <el-divider>Jenkins Dashboard</el-divider>
    <!-- 账号密码 -->
    <el-row :gutter="12">
      <el-form :inline="true" label-width="40px" :model="jenkins" size="mini">
        <el-form-item label="地址">
          <el-input v-model="jenkins.url"></el-input>
        </el-form-item>
        <el-form-item label="账号">
          <el-input v-model="jenkins.user"></el-input>
        </el-form-item>
        <el-form-item label="密码">
          <el-input type="password" v-model="jenkins.pwd"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type @click="submit">保存</el-button>
        </el-form-item>
      </el-form>
    </el-row>
    <!-- 搜索&刷新 -->
    <el-row :gutter="12">
      <el-form :inline="true" label-width="80px" :model="jenkins" size="mini">
        <el-form-item label>
          <el-autocomplete
            class="inline-input"
            v-model="keyword"
            :fetch-suggestions="search"
            placeholder="搜索 job"
            :trigger-on-focus="false"
            @select="handleSelect"
          ></el-autocomplete>
        </el-form-item>
        <el-form-item>
          <el-radio-group v-model="refresh" @change="handleChange">
            <el-radio-button
              v-for="item in options"
              :key="item.value"
              :label="item.value"
            >{{item.label}}</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </el-row>
    <!-- 排队的 -->
    <el-row :gutter="12">
      <div
        v-if="buildQueue.length>0"
        style="text-align: left;font-size: 12px;margin-left: 12px;color: gray;"
      >
        Build Queue
        <el-tag
          v-for="(item, i) in buildQueue"
          :key="i"
          type="info"
          effect="plain"
          style="margin-right: 5px;"
          size="mini"
        >{{ item }}</el-tag>
      </div>
    </el-row>
    <!-- build 面板 -->
    <el-row :gutter="12">
      <el-col v-for="(item, name) in infos" :key="name" :span="6">
        <el-card shadow="hover">
          <div slot="header" class="clearfix">
            <a :href="item.url" target="_blank">
              <span>{{name}}</span>
            </a>
            <i style="float: right; padding: 3px 5px" class="el-icon-close" @click="remove(name)"></i>
          </div>
          <div v-if="item.lastBuild">
            <a :href="item.lastBuild.url + 'console'" target="_blank">
              <el-tag :type="item.color">
                最后一次构建：{{item.lastBuild.number}}
                <i
                  v-if="item.lastBuild.number == item.lastCompletedBuild.number"
                  class="el-icon-finished"
                ></i>
                <i v-else class="el-icon-loading"></i>
              </el-tag>
            </a>
          </div>
          <div v-else>
            <el-tag type="info">最后一次构建：无</el-tag>
          </div>
          <el-button
            type="primary"
            plain
            size="small"
            @click="deploy(name)"
            style="margin-top: 10px"
          >build #{{item.nextBuildNumber}}</el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { setTimeout } from "timers";
export default {
  name: "HelloWorld",
  data() {
    return {
      jenkins: {
        url: "http://testjenkins.wb-intra.com",
        user: "",
        pwd: ""
      },
      jobs: [],
      infos: {},
      keyword: "",
      options: [
        {
          value: "0",
          label: "不自动刷新"
        },
        {
          value: "1",
          label: "1s"
        },
        {
          value: "2",
          label: "2s"
        },
        {
          value: "3",
          label: "3s"
        },
        {
          value: "5",
          label: "5s"
        },
        {
          value: "10",
          label: "10s"
        },
        {
          value: "30",
          label: "30s"
        },
        {
          value: "60",
          label: "60s"
        }
      ],
      refresh: "0",
      auto: false,
      buildQueue: []
    };
  },
  methods: {
    deploy(name) {
      this.axios
        .post(
          "/jenkinsapi/job/" + name + "/buildWithParameters",
          '{"parameter":[{"name":"branch","value":"test"}]',
          {
            auth: {
              username: this.jenkins.user,
              password: this.jenkins.pwd
            },
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            }
          }
        )
        .then(() => {
          this.$message({
            message: name + "开始部署",
            type: "success"
          });

          setTimeout(this.load, 500);
        });
    },
    submit() {
      localStorage.setItem("jenkins", JSON.stringify(this.jenkins));
      if (!this.auto) {
        this.auto = true;
        this.load(true);
      }
    },
    search(keyword, cb) {
      this.axios
        .get("/jenkinsapi/search/suggest?query=" + keyword, {
          auth: {
            username: this.jenkins.user,
            password: this.jenkins.pwd
          }
        })
        .then(response => {
          let suggestions = response.data.suggestions;

          // 调用 callback 返回建议列表的数据
          var results = [];
          for (const s of suggestions) {
            if (s.name.endsWith("rollck")) {
              continue;
            }
            results.push({ value: s.name });
          }

          cb(results);
        });
    },
    handleSelect(item) {
      this.add(item.value);
    },
    add(name) {
      var arr = this.list();
      if (arr.indexOf(name) != -1) {
        return;
      }
      arr.push(name);
      localStorage.setItem("jobs", JSON.stringify(arr));
      this.load();
    },
    remove(name) {
      // console.log(name);
      var arr = this.list();
      arr.splice(arr.indexOf(name), 1);
      localStorage.setItem("jobs", JSON.stringify(arr));
      this.$delete(this.infos, name);
      // this.load();
    },
    handleChange(value) {
      if (value > 0) {
        if (!this.auto) {
          this.auto = true;
          this.load(true);
        }
      } else {
        this.auto = false;
      }
    },
    list() {
      var arr = [];
      var names = localStorage.getItem("jobs");
      if (names) {
        arr = JSON.parse(names);
      }
      return arr;
    },
    load(interval) {
      this.axios
        .get("/jenkinsapi/queue/api/json", {
          auth: {
            username: this.jenkins.user,
            password: this.jenkins.pwd
          }
        })
        .then(resp => {
          var tmp = [];
          for (let item of resp.data.items) {
            if (item.task.name) {
              tmp.push(item.task.name);
            } 
          }
          this.buildQueue = tmp;
        })
        .catch(err => {
          console.log(err);
        });

      var names = this.list();

      var a = [];

      let requests = [];

      for (let name of names) {
        if (name.endsWith("rollck")) {
          continue;
        }
        requests.push(
          this.axios.get("/jenkinsapi/job/" + name + "/api/json", {
            auth: {
              username: this.jenkins.user,
              password: this.jenkins.pwd
            }
          })
        );
      }

      Promise.all(requests)
        .then(values => {
          for (const value of values) {
            let info = {};
            switch (value.data.color) {
              case "notbuilt":
                info.color = "info";
                break;
              case "red":
                info.color = "danger";
                break;
              case "blue":
                info.color = "success";
                break;
              case "blue_anime":
                info.color = "";
                break;
            }
            console.log(value.data)
            // info.color = value.data.color;
            info.nextBuildNumber = value.data.nextBuildNumber;
            info.url = value.data.url;
            info.lastBuild = value.data.lastBuild;
            info.lastCompletedBuild = value.data.lastCompletedBuild;
            a[value.data.name] = info;
            this.$set(this.infos, value.data.name, info);
          }
        })
        .catch(err => console.log(err))
        .finally(() => {
          if (interval && this.refresh > 0) {
            this.auto = true;
            setTimeout(() => {
              this.load(interval);
            }, this.refresh * 1000);
          }
        });
    }
  },
  mounted() {
    var str = localStorage.getItem("jenkins");
    if (str) {
      this.jenkins = JSON.parse(str);
    }
    if (this.jenkins.user && this.jenkins.pwd) {
      this.load(true);
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
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
