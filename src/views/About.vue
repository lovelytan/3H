<template>
  <div>
    <el-drawer
      title="设置"
      :visible.sync="drawer"
      direction="rtl"
      size="30%">

      <div class="drawer">
        <div class="item">
          <div class="left">排期文件</div>
          <div class="right">
            <input type="file" ref="file" @change="fileHandler" />
          </div>
        </div>

        <div class="item">
          <div class="left">饱和度系数</div>
          <div class="right">
            <el-input v-model="coefficient" type="number" step="0.001" :min="0.001" :max="1"
                      @change="calcWorkload" />
          </div>
        </div>
      </div>
    </el-drawer>

    <div class="container">
      <div class="fixed-btn hover" @click="drawer = !drawer">
        <span class="el-icon-s-tools rotate"></span>
      </div>

      <div class="main-box" v-if="excelData">

        <div class="team-selector">
          <el-select v-model="teamSelected" placeholder="请选择团队" :disabled="!teamWorkloadData">
            <el-option
              v-for="(number, name) in team"
              :key="name"
              :label="name"
              :value="name">
            </el-option>
          </el-select>
        </div>

        <div v-if="!!teamSelected" class="main">
          <el-calendar v-model="daySelected">
            <template v-slot:dateCell="{date, data}">
              <div class="calendar-day"
                   :style="data | getStyle({teamWorkloadData, teamSelected, yearDays})">

                <div class="date">{{ data.day.split('-').slice(1).join('-') }}</div>
                <div class="des">
                  <div v-if="yearDays[data.day.split('-').join('')] === 1 && teamWorkloadData[teamSelected][data.day.split('-').join('')]?.workload">
                    <div>工作量：{{teamWorkloadData[teamSelected][data.day.split('-').join('')]?.workload.toFixed(2)}}</div>
                    <div>饱和度: {{ (teamWorkloadData[teamSelected][data.day.split('-').join('')]?.saturation * 100).toFixed(2) }}%</div>
                  </div>
                  <div v-if="yearDays[data.day.split('-').join('')] === 0" class="holiday">休假</div>
                </div>
              </div>

            </template>
          </el-calendar>
        </div>
      </div>
      <el-empty v-else description="暂无数据，点击右下角齿轮进行配置"></el-empty>
    </div>
  </div>
</template>

<script>
import * as xlsx from 'xlsx'
import moment from 'moment'
import axios from 'axios'

export default {
  data () {
    const yearDays = JSON.parse(localStorage.getItem('yearDays') || '{}')
    const coefficient = Number(localStorage.getItem('coefficient') || 0.296)
    return {
      drawer: true,
      excelData: null,
      yearDays,
      daySelected: '',
      team: {
        // 技术总控团队: 3,
        // 产品管理团队: 10,
        平台服务团队: 20,
        开放银行团队: 11,
        融合渠道团队: 21,
        财富贷款团队: 22,
        用户转账团队: 22,
        自助服务团队: 39
      },
      teamSelected: '',
      teamWorkloadData: null,
      coefficient
    }
  },
  components: {},
  watch: {
    yearDays (value) {
      localStorage.setItem('yearDays', JSON.stringify(value))
    },
    coefficient (value) {
      localStorage.setItem('coefficient', value)
    }
  },
  async mounted () {
    await this.getYearDays(2022)
    await this.getYearDays(2023)
  },
  filters: {
    getStyle (data, option) {
      function lerpColor (a, b, amount) {
        const ah = parseInt(a.replace(/#/g, ''), 16)
        const ar = ah >> 16; const ag = ah >> 8 & 0xff; const ab = ah & 0xff
        const bh = parseInt(b.replace(/#/g, ''), 16)
        const br = bh >> 16; const bg = bh >> 8 & 0xff; const bb = bh & 0xff
        const rr = ar + amount * (br - ar)
        const rg = ag + amount * (bg - ag)
        const rb = ab + amount * (bb - ab)
        return 'rgb(' + [rr, rg, rb].join(',') + ')'
      }

      const { teamWorkloadData, teamSelected, yearDays } = option
      const day = data.day.split('-').join('')
      const saturation = teamWorkloadData[teamSelected][data.day.split('-').join('')]?.saturation || 0

      if (yearDays[day] === 0 || !saturation || data.type !== 'current-month') {
        return ''
      }

      const green = '#42b983'
      const lightgreen = '#8cbb25'
      const yellow = '#fcc60c'
      const red = '#ff7480'
      const blackRed = '#DB2A33'
      const color = saturation < 0.5 ? lerpColor(green, lightgreen, saturation)
        : saturation < 1 ? lerpColor(lightgreen, yellow, saturation)
          : saturation === 1 ? red
            : lerpColor(red, blackRed, Number((saturation - 1 >= 1 ? 1 : saturation - 1).toFixed(2)))

      const style = `background-color: ${color};`
      return style
    }
  },
  methods: {
    /**
     * 导入排期列表
     * @param e
     * @returns {Promise<void>}
     */
    async fileHandler (e) {
      const file = e.target.files[0]
      const fileBuffer = await file.arrayBuffer()
      const workbook = xlsx.read(fileBuffer)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      this.excelData = xlsx.utils.sheet_to_json(worksheet)
      this.calcWorkload()
    },
    /**
     * 某年的工作日情况
     * @param year
     * @returns {Promise<{}>}  1-工作日 0-休息日
     */
    async getYearDays (year) {
      if (this.yearDays[year]) { return }
      const startDate = moment().year(year).startOf('year')
      const endDate = moment().year(year).endOf('year')
      const data = {}
      const { data: { days } } = await axios.get(`./holiday/${year}.json`)
      const holidays = days.reduce((res, item) => {
        // 1-上班 0-休息
        res[moment(item.date).format('YYYYMMDD')] = item.isOffDay ? 0 : 1
        return res
      }, {})
      for (let currentDate = startDate; currentDate.isSameOrBefore(endDate); currentDate = currentDate.add(1, 'd')) {
        // 1--工作日 0--休假
        const current = currentDate.format('YYYYMMDD')
        let status
        if (['0', '6'].indexOf(currentDate.format('d')) === -1) { // 周1-5
          status = holidays[current] === 0 ? 0 : 1
        } else { // 周六、日
          status = holidays[current] === 1 ? 1 : 0
        }

        data[currentDate.format('YYYYMMDD')] = status
      }

      Object.assign(this.yearDays, data)
    },
    /**
     * 计算某段时间内的工作日天数
     * @param startDateStr
     * @param endDateStr
     */
    workingDayBetween (startDateStr, endDateStr) {
      const workingDays = []
      const startDate = moment(startDateStr)
      const endDate = moment(endDateStr)

      for (let currentDate = startDate; currentDate.isSameOrBefore(endDate); currentDate = currentDate.add(1, 'd')) {
        const current = currentDate.format('YYYYMMDD')
        if (this.yearDays[current] === 1) {
          workingDays.push(current)
        }
      }
      return workingDays
    },
    /**
     * 计算Excel日期
     * @param numb
     * @param format
     * @returns {string}
     */
    formatExcelDate (numb, format = '') {
      const old = numb - 1
      const t = Math.round((old - Math.floor(old)) * 24 * 60 * 60)
      const time = new Date(1900, 0, old, 0, 0, t)
      const year = time.getFullYear()
      const month = time.getMonth() + 1
      const date = time.getDate()
      return year + format + (month < 10 ? '0' + month : month) + format + (date < 10 ? '0' + date : date)
    },
    /**
     * 计算某团队工作量在全年的分配
     */
    calcWorkload () {
      try {
        this.coefficient = Number(this.coefficient)
      } catch (e) {}
      if (typeof this.coefficient !== 'number' || !this.coefficient || !this.excelData) { return }
      localStorage.setItem('coefficient', this.coefficient)

      const teamData = {}

      this.excelData.forEach(row => {
        const startDateStr = this.formatExcelDate(row['排期创建时间'])
        const endDateStr = this.formatExcelDate(row['计划上线日期'])
        const teamName = row['会签人所属团队']
        const workload = row['工作量']
        const workingDays = this.workingDayBetween(startDateStr, endDateStr)
        const dayWorkload = Number((workload * 22 / workingDays.length).toFixed(3)) // 人天
        workingDays.forEach(day => {
          if (!teamData[teamName]) {
            teamData[teamName] = {}
          }
          if (!teamData[teamName][day]) {
            teamData[teamName][day] = {}
          }
          let { workload = 0 } = teamData[teamName][day]
          workload = Number((workload + dayWorkload).toFixed(3))
          teamData[teamName][day] = {
            workload,
            saturation: Number(this.coefficient * (workload / this.team[teamName]).toFixed(2))
          }
        })
      })

      this.teamWorkloadData = teamData
    }
  }
}

</script>

<style lang="less" scoped>
/deep/ .el-calendar-table .el-calendar-day {
  padding: 0 !important;
}
/deep/ .el-calendar-table td.is-today {
  color: unset !important;

  .date {
    font-weight: bold;
  }
}

.drawer {
  .item {
    display: flex;
    align-items: center;
    padding: 10px;

    .left {
      width: 100px;
      min-width: 100px;
      text-align: right;
      &:after {
        content: ':';
        padding-right: 5px;
      }
    }
    .right {
      flex: 1;
      text-align: left;
    }
  }
}

.fixed-btn {
  width: 32px;
  position: fixed;
  right: 20px;
  bottom: 20px;
  > span {
    font-size: 32px;
    color: #909399;
  }
}

.blink {
  animation: blink-animation 2s ease-in-out infinite;
}

@keyframes blink-animation {
  0% {
    opacity: 0.2;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.2;
  }
}

.rotate {
  animation: rotate-animation 2s linear infinite;
}

@keyframes rotate-animation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.hover {
  cursor: pointer;
}

.main-box {
  .team-selector {
    text-align: right;
    padding-right: 20px;
  }
  .calendar-day {
    height: 100%;
    padding: 8px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;

    .des {
      font-size: 12px;
      display: flex;
      align-content: flex-end;
      align-items: flex-end;
      flex: 1;

      .holiday {
        color: #42b983;
        font-weight: bold;
      }
    }
  }
}

</style>
