//一、定义食物类
class Food{  
    //定义一个属性表示页面中的食物元素(hmtl元素)
    element:HTMLElement
    constructor(){
        this.element = document.querySelector(".food")! 
    }
    //获取食物元素位置
    get x(){
        return this.element.offsetLeft
    }
    get y(){
        return this.element.offsetTop
    }
    //生成食物随机位置，范围在0-290之间(蛇一次移动一格，一格10px,所以生成的随机位置必须是10的倍数)
    randomPosition(){
        this.element.style.left = Math.round( Math.random()*29 ) * 10 + "px"//先取0-29之间整数，在扩大10倍
        this.element.style.top = Math.round( Math.random()*29 ) * 10 + "px"
    }
}


//二、定义计分面板类
class ScorePanel{
    //定义两个用于赋值的属性和两个用于显示的HTML元素
    score:number = 0;
    level:number = 1;
    scoreEle:HTMLElement
    levelEle:HTMLElement
    maxLevel:number //定义一个变量来控制等级，这样可以避免写死最高等级，让代码的可扩展性更高
    addLevelStep:number //定义一个变量来控制多少分升一级
    constructor(maxLevel:number = 10, addLevelStep:number = 5){ //默认最高10级，5分升一级，创建对象时可传值改变
        this.scoreEle = document.querySelector(".score")! 
        this.levelEle = document.querySelector(".level")! 
        this.maxLevel = maxLevel
        this.addLevelStep = addLevelStep
    }
    //加分
    addScore(){
        this.score ++
        this.scoreEle.innerHTML = this.score + "" //转string
        if(this.score % this.addLevelStep === 0){ //分数是5的倍数的时候升一级
            this.addLevel()
        }
    }
    //加等级(等级的改变是因为分数改变引起的，所以在加分方法里需要根据分数来调用addLevel()方法)
    addLevel(){
        if( this.level < this.maxLevel ){ //当前等级level低于最高等级maxLevel(默认10级，可传值改变)才能升级
            this.level ++
            this.levelEle.innerHTML = this.level + ""
        } 
    }
}


//三、定义蛇类
class Snack{
    element:HTMLElement; //蛇容器
    headEle:HTMLElement; //蛇头(身体的第一个元素)
    bodyEles:HTMLCollection //蛇整个身体集合(包含蛇头)
    isHorizontal:boolean = true//此属性用于判断蛇是否在水平方向移动
    isVertical:boolean = false //此属性用于判断蛇是否在垂直方向移动
    constructor(){
        this.element = document.querySelector(".snack") !
        this.headEle = document.querySelector(".snack-body")! //获取第一个元素
        this.bodyEles = this.element.getElementsByTagName("div")
    }
    //获取蛇头位置
    get x(){
        return this.headEle.offsetLeft
    }
    get y(){
        return this.headEle.offsetTop
    }
    //设置蛇头的位置
    set x(value:number){
        //如果蛇头新值与旧值相同，return终止赋值
        if(this.x === value){
            return
        }else{ //调用蛇的setter方法就表明蛇在水平方向移动
            this.isHorizontal = true
            this.isVertical = false
        }
        //校验蛇头是否撞墙(撞墙抛出异常，在GameControl类中去捕获异常，这样就可以实现通信使isAlive = false)
        if( value < 0 || value > 290 ){ //0 - 290
            throw new Error("撞墙，游戏结束")
        }
        //调用设置蛇身体位置的方法(蛇头移动的时候身体也需要移动，所以在此处调用)
        this.moveAllBody()
        //设置蛇头
        this.headEle.style.left = value + "px"
        //设置蛇头最新位置后检查是否撞到自己身体
        this.CrashSelf()
    }
    set y(value:number){
        if(this.y === value){
            return
        }else{
            this.isHorizontal = false
            this.isVertical = true
        }
        if( value < 0 || value > 290 ){
            throw new Error("撞墙，游戏结束")
        }
        this.moveAllBody()
        this.headEle.style.top = value + "px"
        this.CrashSelf()
    }
    //添加身体的方法(蛇体变长)
    addBody(){
        //向蛇容器的末尾追加一个div元素即可
        let newChild = document.createElement("div")
        newChild.classList.add('snack-body')
        this.element.appendChild(newChild)
    }
    //蛇身体移动的方法(除蛇头之外的所有身体,因为蛇头的位置已经在setter中设置了)
    //思路：从后往前给每一节身体设置新的位置，先获取i-1的位置信息，再将i的位置设置为i-1的位置即可
    moveAllBody(){   
        for(let i = this.bodyEles.length - 1; i>0; i--){
            //获取前面一节身体的位置
            let x = (this.bodyEles[i-1] as HTMLElement).offsetLeft; //TS类型断言，告诉TS这就是HTML元素
            let y = (this.bodyEles[i-1] as HTMLElement).offsetTop;
            //设置
            (this.bodyEles[i] as HTMLElement).style.left = x + "px";
            (this.bodyEles[i] as HTMLElement).style.top = y + "px";
        }
    }
    //检查蛇头是否撞到自己身体的方法
    CrashSelf(){
        for(let i = 1; i<this.bodyEles.length; i++){
            let bodyEle =  this.bodyEles[i] as HTMLElement
            if( this.x === bodyEle.offsetLeft && this.y === bodyEle.offsetTop ){
                throw new Error("撞到自己，游戏结束")//run()方法里会捕获到此异常
            }
        }
    }
}


//四、定义游戏控制类
class GameControl{
    food:Food
    scorePanel:ScorePanel
    snack:Snack
    direction:string = 'Right' //用于存储蛇运动方向(也就是按键代表的方向，按键按下时给其赋值;默认游戏开始向右移动)
    isAlive:boolean = true //创建一个属性用于判断游戏是否结束
    tipEle:HTMLElement //游戏结束提示语元素
    constructor(){//构造函数会在创建对象时调用一次
        this.tipEle = document.getElementById("tip")!
        this.food = new Food()
        this.food.randomPosition() //随机生成第一个食物元素
        this.scorePanel = new ScorePanel()
        this.snack = new Snack()
        this.init()
    }
    //游戏初始化
    init(){
        document.addEventListener("keydown",this.keydownHandler.bind(this))
        this.run()
    }
    //键盘按下触发事件(先判断蛇在水平还是垂直方向运动，水平方向只能赋值上下，垂直方向只能赋值左右)
    keydownHandler(e:KeyboardEvent){ 
        if( this.snack.isHorizontal &&  (e.key ===  "ArrowUp" || e.key === "Up" || e.key === "ArrowDown" || e.key ==="Down")){
             //将用户按下的方向键存储起来用于后续设置蛇头偏移量
            this.direction = e.key;
        }else if( this.snack.isVertical && (e.key ===  "ArrowLeft" || e.key === "Left" || e.key === "ArrowRight" || e.key ==="Right")){
            this.direction = e.key;  
        }else if(e.key === " "){ //空格键暂停游戏，不会改变蛇头位置
            this.direction = e.key;
        }
    }
    //定义蛇移动的方法 (通过用户按下的按键赋值的direction属性，给蛇头重新设置位置left 、top)
    run(){
        //获取蛇头当前位置
        let x = this.snack.x
        let y = this.snack.y
        //判断this.direction值
        if( this.direction === "ArrowUp" || this.direction === "Up" ){
            y -= 10
        }else if( this.direction === "ArrowDown" || this.direction ==="Down"){
            y += 10
        }else if(this.direction === "ArrowLeft" || this.direction === "Left"){
            x -= 10
        }else if(this.direction === "ArrowRight" || this.direction === "Right"){
            x += 10
        }
        //蛇移动的过程中要检查是否吃到食物
        this.checkEatFood(x,y)
        //捕获异常
        try{//蛇移动的过程中，判断没有抛出异常才重新设置蛇头的新位置
            this.snack.x = x
            this.snack.y = y
        }catch(e:any){ //捕获到异常后给出提示并终止游戏
            // alert(e.message + 'Game Over ！ ')
            this.tipEle.style.display = "block"
            //让蛇停止移动，终止游戏
            this.isAlive = false
        }
        //让蛇一直跑起来(一次性定时器在300毫秒内连续调用run()方法)
        let _this = this
        this.isAlive && setTimeout(()=>{
            _this.run()
        },300 - (this.scorePanel.level - 1)*30 ) //速度默认一级300毫秒调用一次;等级升一级，速度加快30毫秒 
    }
    //定义一个判断蛇是否吃到食物的方法
    checkEatFood(x:number,y:number){
        if( x === this.food.x && y === this.food.y ){//吃到食物
            //重新生成食物随机位置
            this.food.randomPosition()
            //加分
            this.scorePanel.addScore()
            //蛇身体变长
            this.snack.addBody()
        }
    }
}

//开始游戏
const testGameControl = new GameControl()