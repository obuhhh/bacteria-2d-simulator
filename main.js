import './style.css'

const canvas = document.getElementById('simulator');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth - 20;
canvas.height = window.innerHeight - 20;

const MAX_RED_ENERGY = 1000
const MAX_GREEN_HEAlTH = 1000

const MAX_COUNT = 1000;

class Entity {
    constructor(x, y, size, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.speed = 1
        this.targetDirection = Math.random() * Math.PI * 2;
        this.directionChangeTimer = Math.floor(Math.random() * 60) + 60;
    }

    get opacity() {
        return 1
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    move(dx, dy) {
        this.directionChangeTimer--;
        this.x = Math.min(Math.max(this.x + dx, 0), canvas.width);
        this.y = Math.min(Math.max(this.y + dy, 0), canvas.height);
    }
}

class GreenEntity extends Entity {
    constructor(x, y) {
        super(x, y, 3, 'green');
        this.lifetime = Math.round(Math.random() * (MAX_GREEN_HEAlTH/2) + MAX_GREEN_HEAlTH/2);
        this.reproductionCooldown = 50; // Час охолодження до наступного розмноження
        this.reproductionTimer = 0; // Лічильник часу до наступного розмноження
        this.speed = Math.random() + 1;
        this.observeDistance = 500;
    }

    get opacity() {
        return Math.max(this.lifetime / MAX_GREEN_HEAlTH, 0.1);
    }

    moveRandomly() {
        if (this.directionChangeTimer <= 0) {
            this.targetDirection = Math.random() * Math.PI * 2;
            this.directionChangeTimer = Math.floor(Math.random() * 120) + 120;
        }

        if (this.directionChangeTimer > 5) {
            const dx = Math.random() * 2 - 1; // Випадкове значення від -1 до 1
            const dy = Math.random() * 2 - 1; // Випадкове значення від -1 до 1
            this.move(dx, dy);
        } else {
            const dx = Math.cos(this.targetDirection);
            const dy = Math.sin(this.targetDirection);
            this.move(dx, dy);
        }
    }

    isReadyToReproduce() {
        return this.reproductionTimer <= 0;
    }

    findClosestRedEntity(redEntities) {
        let closestRedEntity = null;
        let closestDistance = Infinity;

        for (const redEntity of redEntities) {
            const dx = redEntity.x - this.x;
            const dy = redEntity.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestRedEntity = redEntity;
            }
        }

        return {
            redEntity: closestRedEntity,
            distance: closestDistance
        };
    }

    findMate(greenEntities) {
        let closestMate = null;
        let closestDistance = Infinity;
        let count = 0;

        for (const greenEntity of greenEntities) {
            if (greenEntity === this) {
                continue;
            }

            const dx = greenEntity.x - this.x;
            const dy = greenEntity.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.observeDistance && distance < closestDistance) {
                closestDistance = distance;
                closestMate = greenEntity;
                count++
            }
        }

        return { mate: closestMate, count };
    }

    reproduce(mate) {
        const newX = (this.x + mate.x) / 2;
        const newY = (this.y + mate.y) / 2;
        const newGreen = new GreenEntity(newX, newY)

        this.lifetime = this.lifetime * 0.7;

        newGreen.speed += (Math.random() * 2 - 1) * 0.1;
        newGreen.reproductionCooldown += Math.random() * 2 - 1

        entities.push(newGreen);

        this.reproductionTimer = this.reproductionCooldown;
        mate.reproductionTimer = mate.reproductionCooldown;
    }

    update(greenEntities, redEntities) {
        this.lifetime -= this.speed;
        if (this.lifetime <= 0) return false

        const { redEntity, distance } = this.findClosestRedEntity(redEntities);
        if (distance <= 20) { // Відстань, на якій зелена сутність починає втікати від червоних
            const dx = this.x - redEntity.x;
            const dy = this.y - redEntity.y;
            this.move(dx / distance * this.speed, dy / distance * this.speed);
        } else {
            this.moveRandomly();
        }

        if (this.isReadyToReproduce() && greenEntities.length < MAX_COUNT) {
            const { mate, count} = this.findMate(greenEntities);
            if (mate && mate.isReadyToReproduce()) {
                const dx = mate.x - this.x;
                const dy = mate.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= (this.size + mate.size) && count < 30) {
                    this.reproduce(mate);
                } else if (distance <= 100) {
                    const speed = this.speed;
                    this.move(dx / distance * speed, dy / distance * speed);
                }
            }
        }

        this.reproductionTimer--;

        return true;
    }

    static createRandom() {
        return new GreenEntity(Math.random() * canvas.width, Math.random() * canvas.height);
    }
}

class RedEntity extends Entity {
    constructor(x, y) {
        super(x, y, 3, 'red');
        this.energy = Math.round(Math.random() * (MAX_RED_ENERGY/2) + MAX_RED_ENERGY/2)
        this.speed = Math.random() + 1.4
        this.observeDistance = canvas.width / 2;
    }

    get opacity() {
        return Math.max(this.energy / MAX_RED_ENERGY, 0.1);
    }

    moveRandomly() {
        if (this.directionChangeTimer <= 0) {
            this.targetDirection = Math.random() * Math.PI * 2;
            this.directionChangeTimer = Math.floor(Math.random() * 60) + 60;
        }

        if (this.directionChangeTimer > 30) {
            const dx = Math.random() * 2 - 1; // Випадкове значення від -1 до 1
            const dy = Math.random() * 2 - 1; // Випадкове значення від -1 до 1
            this.move(dx, dy);
        } else {
            const dx = Math.cos(this.targetDirection);
            const dy = Math.sin(this.targetDirection);
            this.move(dx, dy);
        }
    }

    hunt(greenEntities) {
        let closestGreenEntity = null;
        let closestDistance = Infinity;

        // Знаходимо найближчу зелену сутність
        for (const greenEntity of greenEntities) {
            const dx = greenEntity.x - this.x;
            const dy = greenEntity.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.observeDistance && distance < closestDistance) {
                closestDistance = distance;
                closestGreenEntity = greenEntity;
            }
        }

        if (!closestGreenEntity) {
            this.moveRandomly();
            return
        }

        // Якщо найближча зелена сутність знаходиться на відстані менше або дорівнює радіусу червоної сутності,
        // "з'їдаємо" її та забираємо енергію
        if (closestDistance <= (this.size + closestGreenEntity.size)) {
            this.energy = Math.min(this.energy + 75, MAX_RED_ENERGY)
            closestGreenEntity.lifetime = 0
        } else {
            const dx = closestGreenEntity.x - this.x;
            const dy = closestGreenEntity.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const speed = this.speed * (closestDistance < 40 ? 1 : 1.3)
            if (closestDistance < 40) this.energy -= 0.1;

            this.move(dx / distance * speed, dy / distance * speed);
        }
    }

    reproduce() {
        const reproductionChance = Math.random();
        if (this.energy > (MAX_RED_ENERGY * 0.7) && reproductionChance > 0.1) { // Випадковість успішного розмноження
            const newRed = new RedEntity(this.x, this.y)
            newRed.energy = Math.round(this.energy / 2)

            this.speed += (Math.random() * 2 - 1) * 0.05;
            this.energy = Math.round(this.energy / 3)

            entities.push(newRed);
        }
    }

    draw () {
        super.draw();
        // ctx.font = "8px Arial";
        // ctx.fillText(`${this.energy}`, this.x + 2, this.y - 2);
    }
    update(greenEntities, redEntities) {
        this.hunt(greenEntities);
        this.energy -= this.speed;

        if (this.energy <= 0) {
            // Знищуємо сутність, якщо закінчилася енергія
            return false;
        }

        if (redEntities.length < MAX_COUNT) {
            this.reproduce();
        }

        // Якщо все добре, повертаємо true
        return true;
    }

    static createRandom() {
        return new RedEntity(Math.random() * canvas.width, Math.random() * canvas.height)
    }
}


const entities = [];
function update() {
    const newEntities = [];
    const greenEntities = entities.filter(entity => entity instanceof GreenEntity);
    const redEntities = entities.filter(entity => entity instanceof RedEntity);

    for (const entity of entities) {
        if (entity instanceof GreenEntity) {
            if (entity.update(greenEntities, redEntities)) {
                newEntities.push(entity);
            }
        } else if (entity instanceof RedEntity) {
            if (entity.update(greenEntities, redEntities)) {
                newEntities.push(entity);
            }
        }
    }

    entities.length = 0;
    entities.push(...newEntities);

    draw(greenEntities, redEntities);

    if (Math.random() < 0.04) {
        entities.push(GreenEntity.createRandom());
    }

    if (Math.random() < 0.005) {
        entities.push(RedEntity.createRandom());
    }

    requestAnimationFrame(update);
}


function draw(greenEntities, redEntities) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = "12px Arial";
    ctx.fillStyle = 'red';
    ctx.fillText(`${redEntities.length}`,  10, 20);
    ctx.fillStyle = 'green';
    ctx.fillText(`${greenEntities.length}`,  10, 40);

    for (const entity of entities) {
        entity.draw();
    }
}
function randomPosition(min, max) {
    return Math.random() * (max - min) + min;
}

const initialGreenEntities = 50;
const initialRedEntities = 10;

function init() {
    for (let i = 0; i < initialGreenEntities; i++) {
        entities.push(new GreenEntity(randomPosition(0, canvas.width), randomPosition(0, canvas.height)));
    }

    for (let i = 0; i < initialRedEntities; i++) {
        entities.push(new RedEntity(randomPosition(0, canvas.width), randomPosition(0, canvas.height)));
    }

    update();
}

init();
