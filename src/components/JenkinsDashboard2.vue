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
      <el-col v-for="(name, idx) in names" :key="idx" :span="6">
        <el-card shadow="hover">
          <div v-if="infos[name]" slot="header" class="clearfix">
            <a :href="infos[name].url" target="_blank">
              <span>{{name}}</span>
            </a>
            <i style="float: right; padding: 3px 5px" class="el-icon-close" @click="remove(name)"></i>
          </div>
          <div v-if="infos[name].lastBuild">
            <a :href="infos[name].lastBuild.url + 'console'" target="_blank">
              <el-tag :type="infos[name].color">
                last build：{{infos[name].lastBuildNum}}
                <i
                  v-if="infos[name].status == 'IN_PROGRESS'"
                  class="el-icon-loading"
                ></i>
                <i v-else class="el-icon-finished"></i>
              </el-tag>
            </a>
          </div>
          <div v-else>
            <el-tag type="info">last build：n/a</el-tag>
          </div>
          <el-button
            type="primary"
            plain
            size="small"
            @click="deploy(name)"
            style="margin-top: 10px"
          >build</el-button>

          <div v-if="!infos[name]" slot="header" class="clearfix">
            <span>{{name}}</span>
            <i style="float: right; padding: 3px 5px" class="el-icon-close" @click="remove(name)"></i>
          </div>
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
      fullscreenLoading: false,
      names: []
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
      var str = localStorage.getItem("jobs");
      if (str) {
        arr = JSON.parse(str);
        this.names = arr;
      }
      return arr;
    },
    init() {
      var names = this.list();
      for (let name of names) {
        if (name.endsWith("rollck")) {
          continue;
        }
        if (this.blacklist.indexOf(name) > -1) {
          continue;
        }

        this.axios
          .get(
            this.jenkins.url +
              "/job/" +
              name +
              "/api/json" +
              "?tree=builds[number,timestamp,result]{0,1}",
            {
              auth: {
                username: this.jenkins.user,
                password: this.jenkins.pwd
              }
            }
          )
          .then(value => {
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

            info.status = "";
            info.lastBuildNum = 0;

            info.nextBuildNumber = value.data.nextBuildNumber;
            info.url = value.data.url;
            info.lastBuild = value.data.lastBuild;
            info.lastCompletedBuild = value.data.lastCompletedBuild;
            this.$set(this.infos, value.data.name, info);

            this.shuaxin(name);
          })
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
          });
      }
    },
    shuaxin(name) {
      if (name.endsWith("rollck")) {
        return;
      }
      if (this.blacklist.indexOf(name) > -1) {
        return;
      }

      this.axios
        .get(
          this.jenkins.url +
            "/job/" +
            name +
            "/wfapi/runs?since=%23" +
            this.infos[name].lastBuild.number +
            "&fullStages=false&_=" +
            Date.now(),
          {
            auth: {
              username: this.jenkins.user,
              password: this.jenkins.pwd
            }
          }
        )
        .then(value => {
          // console.log(value);
          if (value.data) {
            // if (value.data.length == 1) {
            this.infos[name].startTimeMillis = value.data[0].startTimeMillis;
            this.infos[name].lastBuildNum = parseInt(value.data[0].id);
            this.infos[name].color = this.getColor(value.data[0].status);
            // } else {
            //   for (let d of value.data) {
            //     if (d.status != "IN_PROGRESS") {
            //       this.infos[name].lastBuildNum = parseInt(d.id);
            //       break;
            //     }
            //   }
            //   this.infos[name].status = value.data[0].status;
            // status: IN_PROGRESS  SUCCESS   ABORTED
            // }
            // setTimeout(() => {
            //   this.shuaxin(name);
            // }, 2 * 1000);
          }
        })
        .catch(() => {
          this.blacklist.push(name);

          // if (error.response && error.response.status == 404) {
          //   // console.log("not find: " + error.response.config.url);
          //   this.$notify({
          //     title: name,
          //     message: "Not Find",
          //     type: "warning"
          //   });
          // } else {
          //   // console.log(error);
          //   this.$notify.error({
          //     title: name,
          //     message: error
          //   });
          // }

          // this.blacklist.push(name);
        });
    },
    getColor(status) {
      switch (status) {
        case "ABORTED":
          return "info";
      }
      return "success";
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
            .get(this.jenkins.url + "/job/" + name + "/api/json", {
              auth: {
                username: this.jenkins.user,
                password: this.jenkins.pwd
              }
            })
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
            let info = {};
            if (!value) {
              continue;
            }
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
            // console.log(value.data);
            // info.color = value.data.color;
            info.nextBuildNumber = value.data.nextBuildNumber;
            info.url = value.data.url;
            info.lastBuild = value.data.lastBuild;
            info.lastCompletedBuild = value.data.lastCompletedBuild;
            this.$set(this.infos, value.data.name, info);

            this.axios
              .get(
                this.jenkins.url +
                  "/job/" +
                  value.data.name +
                  "/wfapi/runs?since=%23" +
                  value.data.lastBuild.number +
                  "&fullStages=true&_=" +
                  Date.now(),
                {
                  auth: {
                    username: this.jenkins.user,
                    password: this.jenkins.pwd
                  }
                }
              )
              .then(resp => {
                console.log(resp);
              });
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
      this.noOp = setTimeout(() => {
        this.refresh = 0;
        this.auto = false;
      }, 5 * 60 * 1000);
    },
    handleEnvChange(env) {
      // this.fullscreenLoading = true;
      this.blacklist = [];
      this.infos = {};
      for (var e of this.envs) {
        if (env == e.name) {
          this.jenkins = e;
          // this.load(true);
          this.init();
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
