<template>
  <div id="app">
    <JenkinsDashboard />
    <!-- <PushSetting/> -->
  </div>
</template>

<script>
import JenkinsDashboard from "./components/JenkinsDashboard3.vue";
// import PushSetting from "./components/PushSetting.vue";

export default {
  name: "app",
  components: {
    JenkinsDashboard
    // PushSetting
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
