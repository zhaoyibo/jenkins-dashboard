<template>
  <div class="main" @click="clickAny">
    <h1>Wanba Jenkins Dashboard</h1>

    <!-- 环境 & 搜索 -->
    <el-row :gutter="12">
      <el-form :inline="true" label-width="100px" :model="jenkins" size="mini">
        <el-form-item>
          <el-radio-group
            v-model="env"
            @change="handleEnvChange"
            v-loading.fullscreen.lock="fullscreenLoading"
          >
            <el-radio-button v-for="item in envs" :key="item.name" :label="item.name">{{item.name}}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label>
          <el-autocomplete
            class="inline-input"
            v-model="keyword"
            :fetch-suggestions="search"
            placeholder="search"
            :trigger-on-focus="false"
            @select="handleSelect"
          ></el-autocomplete>
        </el-form-item>
      </el-form>
    </el-row>

    <!-- 刷新 -->
    <el-row :gutter="12">
      <el-form :inline="true" label-width="80px" :model="jenkins" size="mini">
        <el-form-item>
          <el-radio-group
            v-model="refresh"
            @change="handleChange"
            v-loading.fullscreen.lock="fullscreenLoading"
          >
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
          <div v-if="item.number">
            <a :href="item.url +  item.number + '/console'" target="_blank">
              <!-- <el-tag :type="item.color">
                last build：{{item.number}}
                <i
                  v-if="item.result == 'IN_PROGRESS'"
                  class="el-icon-loading"
                ></i>
                <i v-else-if="item.result == 'SUCCESS'" class="el-icon-finished"></i>
                <i v-else class="el-icon-close"></i>
                <br />
                {{item.timestamp}}
              </el-tag>-->
              <el-button plain :type="item.color">
                last build：#{{item.number}}
                <i v-if="item.building" class="el-icon-loading"></i>
                <i v-else-if="item.result == 'SUCCESS'" class="el-icon-finished"></i>
                <i v-else class="el-icon-close"></i>
                <br />
                <br />
                <span style="font-size:12px">{{item.timestamp}}</span>
              </el-button>
            </a>
          </div>
          <div v-else>
            <el-tag type="info">last build：n/a</el-tag>
          </div>
          <el-button type plain size="small" @click="deploy(name)" style="margin-top: 10px">build</el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { setTimeout, clearTimeout } from "timers";
export default {
  name: "HelloWorld",
  data() {
    return {
      jenkins: {
        // url: "http://testjenkins.wb-intra.com",
        url: "",
        user: "",
        pwd: ""
      },
      testEnv: false,
      jobs: [],
      infos: {},
      keyword: "",
      options: [
        {
          value: "0",
          label: "manual"
        },
        // {
        //   value: "1",
        //   label: "1s"
        // },
        // {
        //   value: "2",
        //   label: "2s"
        // },
        // {
        //   value: "3",
        //   label: "3s"
        // },
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
        }
      ],
      refresh: "0",
      auto: false,
      buildQueue: [],
      noOp: null,
      blacklist: [],
      envs: [
        {
          name: "dev",
          url: process.env.VUE_APP_BASE_API_DEV,
          user: "devuser",
          pwd: "devuser"
        },
        {
          name: "test",
          url: process.env.VUE_APP_BASE_API_TEST,
          user: "testuser",
          pwd: "testuser"
        }
      ],
      env: "test",
      fullscreenLoading: false
    };
  },
  methods: {
    deploy(name) {
      this.axios
        .post(
          this.jenkins.url + "/job/" + name + "/buildWithParameters",
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
        .get(this.jenkins.url + "/search/suggest?query=" + keyword, {
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
          this.fullscreenLoading = true;
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
        .get(this.jenkins.url + "/queue/api/json", {
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
        .catch(error => {
          this.refresh = "0";
          this.auto = false;
          this.$notify.error({
            title: "Jenkins Build Queue",
            message: error
          });
        });

      var names = this.list();

      let requests = [];

      for (let name of names) {
        if (name.endsWith("rollck")) {
          continue;
        }
        if (this.blacklist.indexOf(name) > -1) {
          continue;
        }
        requests.push(
          this.axios
            .get(
              this.jenkins.url +
                "/job/" +
                name +
                "/api/json?tree=" +
                encodeURI(
                  "name,url,builds[number,timestamp,result,building]{0,1}"
                ),
              {
                auth: {
                  username: this.jenkins.user,
                  password: this.jenkins.pwd
                }
              }
            )
            .catch(error => {
              if (error.response && error.response.status == 404) {
                // console.log("not find: " + error.response.config.url);
                this.$notify({
                  title: name,
                  message: "Not Find",
                  type: "warning"
                });
              } else {
                // console.log(error);
                this.$notify.error({
                  title: name,
                  message: error
                });
              }

              this.blacklist.push(name);
            })
        );
      }

      Promise.all(requests)
        .then(values => {
          for (const value of values) {
            if (!value) {
              continue;
            }
            console.log(value.data);

            let lastBuild = value.data.builds[0] || {};
            let info = {
              color: "primary",
              url: value.data.url,
              number: lastBuild.number,
              result: lastBuild.result,
              building: lastBuild.building,
              timestamp: this.dataFormat(new Date(lastBuild.timestamp))
            };

            switch (lastBuild.result) {
              case "SUCCESS":
                info.color = "success";
                break;
              case "ABORTED":
                info.color = "info";
                break;
              default:
                if (!lastBuild.building) {
                  info.color = "danger";
                }
            }

            this.$set(this.infos, value.data.name, info);
          }
        })
        .catch(err => console.log(err))
        .finally(() => {
          this.fullscreenLoading = false;
          if (interval && this.refresh > 0) {
            this.auto = true;
            setTimeout(() => {
              this.load(interval);
            }, this.refresh * 1000);
          }
        });
    },
    clickAny() {
      if (this.noOp) {
        clearTimeout(this.noOp);
      }
      var neverStop = localStorage.getItem("neverStop");
      if (!neverStop) {
        this.noOp = setTimeout(() => {
          this.refresh = 0;
          this.auto = false;
        }, 5 * 60 * 1000);
      }
    },
    handleEnvChange(env) {
      this.fullscreenLoading = true;
      this.blacklist = [];
      this.infos = {};
      for (var e of this.envs) {
        if (env == e.name) {
          this.jenkins = e;
          // this.jenkins.user = e.user;
          // this.jenkins.pwd = e.pwd;
          this.load(true);
          break;
        }
      }
    },
    openFullScreen() {
      const loading = this.$loading({
        lock: true,
        text: "Loading",
        spinner: "el-icon-loading",
        background: "rgba(0, 0, 0, 0.7)"
      });
      setTimeout(() => {
        loading.close();
      }, 2000);
    },
    dataFormat(time) {
      return `${time.getFullYear()}-${
        time.getMonth() + 1 >= 10
          ? time.getMonth() + 1
          : "0" + (time.getMonth() + 1)
      }-${time.getDate() >= 10 ? time.getDate() : "0" + time.getDate()}
                     ${
                       time.getHours() >= 10
                         ? time.getHours()
                         : "0" + time.getHours()
                     }:${
        time.getMinutes() >= 10 ? time.getMinutes() : "0" + time.getMinutes()
      }:${
        time.getSeconds() >= 10 ? time.getSeconds() : "0" + time.getSeconds()
      }`;
    }
  },
  mounted() {
    var str = localStorage.getItem("options");
    if (str) {
      this.options = JSON.parse(str);
    }
    this.handleEnvChange(this.env);
    // if (this.jenkins.user && this.jenkins.pwd) {
    //   this.load(true);
    // }
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
